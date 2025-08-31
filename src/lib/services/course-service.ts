// Course Management API Client
// This file provides a clean interface to interact with the course creation backend

export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  title: string;
  courseId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'pptx';
  fileUrl?: string;
  duration?: string;
  topicId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  size: number;
  type: 'video' | 'pdf' | 'pptx';
  duration?: string;
  pageCount?: number;
  thumbnail?: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  imageUrl?: string;
  userId: string;
  topics?: {
    title: string;
    lessons?: {
      title: string;
      type: 'video' | 'pdf' | 'pptx';
      fileUrl?: string;
      duration?: string;
    }[];
  }[];
}

class CourseService {
  private baseUrl = '/api';

  // Course management
  async createCourse(courseData: CreateCourseData): Promise<Course> {
    const response = await fetch(`${this.baseUrl}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create course');
    }

    const result = await response.json();
    return result.course;
  }

  async getCourses(userId: string): Promise<Course[]> {
    const response = await fetch(`${this.baseUrl}/courses?userId=${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch courses');
    }

    const result = await response.json();
    return result.courses;
  }

  async deleteCourse(courseId: string, userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/courses?courseId=${courseId}&userId=${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete course');
    }

    console.log(`Course ${courseId} deleted successfully`);
  }

  // Topic management
  async createTopic(title: string, courseId: string): Promise<Topic> {
    const response = await fetch(`${this.baseUrl}/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, courseId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create topic');
    }

    const result = await response.json();
    return result.topic;
  }

  async getTopics(courseId: string): Promise<Topic[]> {
    const response = await fetch(`${this.baseUrl}/topics?courseId=${courseId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch topics');
    }

    const result = await response.json();
    return result.topics;
  }

  async updateTopic(topicId: string, updates: { title?: string; order?: number }): Promise<Topic> {
    const response = await fetch(`${this.baseUrl}/topics`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topicId, ...updates }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update topic');
    }

    const result = await response.json();
    return result.topic;
  }

  async deleteTopic(topicId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/topics?topicId=${topicId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete topic');
    }
  }

  // Lesson management
  async createLesson(lessonData: {
    title: string;
    type: 'video' | 'pdf' | 'pptx';
    topicId: string;
    fileId?: string;
    duration?: string;
  }): Promise<Lesson> {
    const response = await fetch(`${this.baseUrl}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lessonData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create lesson');
    }

    const result = await response.json();
    return result.lesson;
  }

  async getLessons(topicId: string): Promise<Lesson[]> {
    const response = await fetch(`${this.baseUrl}/lessons?topicId=${topicId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch lessons');
    }

    const result = await response.json();
    return result.lessons;
  }

  async updateLesson(lessonId: string, updates: {
    title?: string;
    order?: number;
    duration?: string;
    fileUrl?: string;
  }): Promise<Lesson> {
    const response = await fetch(`${this.baseUrl}/lessons/${lessonId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update lesson');
    }

    const result = await response.json();
    return result.lesson;
  }

  async deleteLesson(lessonId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/lessons?lessonId=${lessonId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete lesson');
    }
  }

  // File upload and processing
  async uploadFile(
    file: File,
    userId: string,
    lessonId?: string,
    topicId?: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    if (lessonId) {
      formData.append('lessonId', lessonId);
    }
    if (topicId) {
      formData.append('topicId', topicId);
    }

    // Use XMLHttpRequest for progress tracking with Supabase upload
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText);
          resolve(result.file);
        } else {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Failed to upload file'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Failed to upload file'));
      });

      xhr.open('POST', `${this.baseUrl}/upload-supabase`);
      xhr.send(formData);
    });
  }

  // Upload image to Supabase Storage
  async uploadImage(
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; publicId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('type', 'image');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText);
          resolve({
            url: result.file.url,
            publicId: result.file.filename
          });
        } else {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Failed to upload image'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Failed to upload image'));
      });

      xhr.open('POST', `${this.baseUrl}/upload-supabase`);
      xhr.send(formData);
    });
  }

  async processFile(filePath: string, fileType: 'video' | 'pdf', originalName: string) {
    const response = await fetch(`${this.baseUrl}/process-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath, fileType, originalName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process file');
    }

    const result = await response.json();
    return result.metadata;
  }

  async getFileInfo(fileId: string, userId: string) {
    const response = await fetch(`${this.baseUrl}/upload?fileId=${fileId}&userId=${userId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch file info');
    }

    const result = await response.json();
    return result.file;
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  validateFile(file: File): { isValid: boolean; error?: string; fileType?: 'video' | 'pdf' | 'pptx' } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const videoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
    const pdfTypes = ['application/pdf'];
    const pptxTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];
    
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 100MB' };
    }
    
    if (videoTypes.includes(file.type)) {
      return { isValid: true, fileType: 'video' };
    }
    
    if (pdfTypes.includes(file.type)) {
      return { isValid: true, fileType: 'pdf' };
    }
    
    if (pptxTypes.includes(file.type)) {
      return { isValid: true, fileType: 'pptx' };
    }
    
        return { isValid: false, error: 'Only MP4, WebM, MOV, AVI videos, PDF files, and PowerPoint presentations are supported' };
  }

  validateImage(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB for images
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (file.size > maxSize) {
      return { isValid: false, error: 'Image size must be less than 10MB' };
    }
    
    if (!imageTypes.includes(file.type)) {
      return { isValid: false, error: 'Only JPEG, PNG, and WebP images are supported' };
    }
    
    return { isValid: true };
  }
}

// Export singleton instance
export const courseService = new CourseService();
