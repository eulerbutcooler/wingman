'use client';

import React, { useState, useRef } from 'react';
import { courseService } from '@/lib/services/course-service';
import { useCourseCreator } from '@/hooks/use-course-creator';

interface CourseCreatorProps {
  userId: string;
  onSuccess: (course: any) => void;
  onCancel: () => void;
}

export default function CourseCreator({ userId, onSuccess, onCancel }: CourseCreatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: ''
  });
  const [topics, setTopics] = useState<Array<{
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
      type: 'video' | 'pdf';
      file?: File;
      uploading?: boolean;
      uploadProgress?: number;
    }>;
  }>>([]);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const addTopic = () => {
    const newTopic = {
      id: `topic-${Date.now()}`,
      title: `Module ${topics.length + 1}`,
      lessons: []
    };
    setTopics([...topics, newTopic]);
  };

  const updateTopic = (topicId: string, title: string) => {
    setTopics(topics.map(topic => 
      topic.id === topicId ? { ...topic, title } : topic
    ));
  };

  const removeTopic = (topicId: string) => {
    setTopics(topics.filter(topic => topic.id !== topicId));
  };

  const addLesson = (topicId: string) => {
    const newLesson = {
      id: `lesson-${Date.now()}`,
      title: 'New Lesson',
      type: 'video' as const
    };
    setTopics(topics.map(topic => 
      topic.id === topicId 
        ? { ...topic, lessons: [...topic.lessons, newLesson] }
        : topic
    ));
  };

  const updateLesson = (topicId: string, lessonId: string, updates: any) => {
    setTopics(topics.map(topic => 
      topic.id === topicId 
        ? {
            ...topic, 
            lessons: topic.lessons.map(lesson => 
              lesson.id === lessonId ? { ...lesson, ...updates } : lesson
            )
          }
        : topic
    ));
  };

  const removeLesson = (topicId: string, lessonId: string) => {
    setTopics(topics.map(topic => 
      topic.id === topicId 
        ? { ...topic, lessons: topic.lessons.filter(lesson => lesson.id !== lessonId) }
        : topic
    ));
  };

  const handleFileSelect = (topicId: string, lessonId: string, file: File) => {
    const validation = courseService.validateFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    updateLesson(topicId, lessonId, { 
      file, 
      type: validation.fileType,
      uploading: false 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare course data
      const courseData = {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl || `https://placehold.co/600x400/000000/FFFFFF?text=${encodeURIComponent(formData.title)}`,
        userId,
        topics: topics.map(topic => ({
          title: topic.title,
          lessons: topic.lessons.map(lesson => ({
            title: lesson.title,
            type: lesson.type,
            duration: lesson.type === 'video' ? '0:00' : undefined
          }))
        }))
      };

      // Create the course
      const createdCourse = await courseService.createCourse(courseData);
      console.log('Course created:', createdCourse);

      // Upload files for lessons that have them
      for (const topic of topics) {
        for (const lesson of topic.lessons) {
          if (lesson.file) {
            try {
              updateLesson(topic.id, lesson.id, { uploading: true, uploadProgress: 0 });
              
              // Find the corresponding lesson in the created course
              const createdTopic = createdCourse.topics?.find(t => t.title === topic.title);
              const createdLesson = createdTopic?.lessons?.find(l => l.title === lesson.title);
              
              if (createdLesson) {
                await courseService.uploadFile(
                  lesson.file,
                  userId,
                  createdLesson.id,
                  (progress) => {
                    updateLesson(topic.id, lesson.id, { uploadProgress: progress });
                  }
                );
                updateLesson(topic.id, lesson.id, { uploading: false, uploadProgress: 100 });
              }
            } catch (error) {
              console.error('File upload failed:', error);
              updateLesson(topic.id, lesson.id, { uploading: false, uploadProgress: 0 });
            }
          }
        }
      }

      onSuccess(createdCourse);
    } catch (error) {
      console.error('Course creation failed:', error);
      alert(`Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-gray-600">Build a comprehensive learning experience</p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Course Details */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Course Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter course title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what students will learn"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Image URL (optional)
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>

        {/* Topics */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Course Topics</h2>
            <button
              type="button"
              onClick={addTopic}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Topic
            </button>
          </div>

          <div className="space-y-6">
            {topics.map((topic, topicIndex) => (
              <div key={topic.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-4">
                  <input
                    type="text"
                    value={topic.title}
                    onChange={(e) => updateTopic(topic.id, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Topic title"
                  />
                  <button
                    type="button"
                    onClick={() => addLesson(topic.id)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Add Lesson
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTopic(topic.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>

                {/* Lessons */}
                <div className="space-y-3 ml-4">
                  {topic.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => updateLesson(topic.id, lesson.id, { title: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Lesson title"
                      />
                      <select
                        value={lesson.type}
                        onChange={(e) => updateLesson(topic.id, lesson.id, { type: e.target.value as 'video' | 'pdf' })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="video">Video</option>
                        <option value="pdf">PDF</option>
                      </select>
                      <input
                        ref={(el) => {
                          fileInputRefs.current[`${topic.id}-${lesson.id}`] = el;
                        }}
                        type="file"
                        accept={lesson.type === 'video' ? 'video/*' : '.pdf'}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelect(topic.id, lesson.id, file);
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRefs.current[`${topic.id}-${lesson.id}`]?.click();
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        {lesson.file ? 'Change File' : 'Select File'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLesson(topic.id, lesson.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.title || !formData.description}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating Course...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}
