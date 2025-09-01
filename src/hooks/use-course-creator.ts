import { useState, useCallback } from 'react';
import { courseService, type Course, type Topic, type Lesson, type UploadedFile } from '@/lib/services/course-service';

export interface UseCourseCreatorOptions {
  userId: string;
  onSuccess?: (course: Course) => void;
  onError?: (error: string) => void;
}

export interface CourseFormData {
  title: string;
  description: string;
  imageUrl: string;
  topics: TopicFormData[];
}

export interface TopicFormData {
  id: string;
  title: string;
  lessons: LessonFormData[];
}

export interface LessonFormData {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'pptx';
  file?: UploadedFile;
  duration?: string;
}

export function useCourseCreator({ userId, onSuccess, onError }: UseCourseCreatorOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);

  // Course form management
  const [courseData, setCourseData] = useState<CourseFormData>({
    title: '',
    description: '',
    imageUrl: 'https://placehold.co/600x400/000000/FFFFFF?text=New+Course',
    topics: [],
  });

  // Add a new topic
  const addTopic = useCallback(() => {
    const newTopic: TopicFormData = {
      id: `topic-${Date.now()}`,
      title: `Module ${courseData.topics.length + 1}`,
      lessons: [],
    };
    setCourseData(prev => ({
      ...prev,
      topics: [...prev.topics, newTopic],
    }));
  }, [courseData.topics.length]);

  // Update topic
  const updateTopic = useCallback((topicId: string, updates: Partial<TopicFormData>) => {
    setCourseData(prev => ({
      ...prev,
      topics: prev.topics.map(topic =>
        topic.id === topicId ? { ...topic, ...updates } : topic
      ),
    }));
  }, []);

  // Remove topic
  const removeTopic = useCallback((topicId: string) => {
    setCourseData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic.id !== topicId),
    }));
  }, []);

  // Add lesson to topic
  const addLesson = useCallback((topicId: string, lesson: LessonFormData) => {
    setCourseData(prev => ({
      ...prev,
      topics: prev.topics.map(topic =>
        topic.id === topicId
          ? { ...topic, lessons: [...topic.lessons, lesson] }
          : topic
      ),
    }));
  }, []);

  // Update lesson
  const updateLesson = useCallback((topicId: string, lessonId: string, updates: Partial<LessonFormData>) => {
    setCourseData(prev => ({
      ...prev,
      topics: prev.topics.map(topic =>
        topic.id === topicId
          ? {
              ...topic,
              lessons: topic.lessons.map(lesson =>
                lesson.id === lessonId ? { ...lesson, ...updates } : lesson
              ),
            }
          : topic
      ),
    }));
  }, []);

  // Remove lesson
  const removeLesson = useCallback((topicId: string, lessonId: string) => {
    setCourseData(prev => ({
      ...prev,
      topics: prev.topics.map(topic =>
        topic.id === topicId
          ? { ...topic, lessons: topic.lessons.filter(lesson => lesson.id !== lessonId) }
          : topic
      ),
    }));
  }, []);

  // File upload
  const uploadFile = useCallback(async (file: File, topicId: string): Promise<UploadedFile> => {
    const fileId = `${file.name}-${Date.now()}`;
    
    try {
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      const uploadedFile = await courseService.uploadFile(
        file,
        userId,
        undefined,
        topicId,
        (progress: number) => {
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
        }
      );

      // Process file to extract metadata
      const metadata = await courseService.processFile(
        uploadedFile.url,
        uploadedFile.type,
        uploadedFile.originalName
      );

      const processedFile: UploadedFile = {
        ...uploadedFile,
        ...metadata,
      };

      // Remove from progress tracking
      setUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[fileId];
        return updated;
      });

      return processedFile;
    } catch (error) {
      // Remove from progress tracking on error
      setUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[fileId];
        return updated;
      });
      throw error;
    }
  }, [userId]);

  // Validate course data
  const validateCourse = useCallback((): boolean => {
    const newErrors: string[] = [];

    if (!courseData.title.trim()) {
      newErrors.push('Course title is required');
    }

    if (!courseData.description.trim()) {
      newErrors.push('Course description is required');
    }

    if (courseData.topics.length === 0) {
      newErrors.push('At least one topic is required');
    }

    courseData.topics.forEach((topic, index) => {
      if (!topic.title.trim()) {
        newErrors.push(`Topic ${index + 1} title is required`);
      }

      if (topic.lessons.length === 0) {
        newErrors.push(`Topic ${index + 1} must have at least one lesson`);
      }

      topic.lessons.forEach((lesson, lessonIndex) => {
        if (!lesson.title.trim()) {
          newErrors.push(`Topic ${index + 1}, Lesson ${lessonIndex + 1} title is required`);
        }
      });
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [courseData]);

  // Save course
  const saveCourse = useCallback(async () => {
    if (!validateCourse()) {
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      // Prepare course data for API
      const coursePayload = {
        title: courseData.title,
        description: courseData.description,
        imageUrl: courseData.imageUrl,
        userId,
        topics: courseData.topics.map(topic => ({
          title: topic.title,
          lessons: topic.lessons.map(lesson => ({
            title: lesson.title,
            type: lesson.type,
            fileUrl: lesson.file?.url,
            duration: lesson.duration,
          })),
        })),
      };

      const createdCourse = await courseService.createCourse(coursePayload);
      
      onSuccess?.(createdCourse);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create course';
      setErrors([errorMessage]);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [courseData, userId, validateCourse, onSuccess, onError]);

  // Reset form
  const resetForm = useCallback(() => {
    setCourseData({
      title: '',
      description: '',
      imageUrl: 'https://placehold.co/600x400/000000/FFFFFF?text=New+Course',
      topics: [],
    });
    setErrors([]);
    setUploadProgress({});
  }, []);

  return {
    // State
    courseData,
    isLoading,
    uploadProgress,
    errors,
    
    // Course management
    setCourseData,
    
    // Topic management
    addTopic,
    updateTopic,
    removeTopic,
    
    // Lesson management
    addLesson,
    updateLesson,
    removeLesson,
    
    // File management
    uploadFile,
    
    // Form management
    validateCourse,
    saveCourse,
    resetForm,
  };
}
