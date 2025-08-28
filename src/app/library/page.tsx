'use client';

import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import DashboardLayout from '@/components/layout';
import CourseCreator from '@/components/CourseCreator';
import { courseService, type Course as CourseType, type Topic as TopicType, type Lesson as LessonType } from '@/lib/services/course-service';

// --- ICONS (Using inline SVGs for simplicity) ---
const Plus: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const ArrowLeft: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);
const BookOpen: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
);
const Video: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 8-6 4 6 4V8z"></path><rect x="2" y="6" width="14" height="12" rx="2" ry="2"></rect></svg>
);
const FileText: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);

// --- TYPESCRIPT INTERFACES ---
// Using the interfaces from course service to avoid type conflicts
interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'pdf';
  duration?: string;
  fileUrl?: string;
  topicId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface Topic {
  id: string;
  title: string;
  courseId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  lessons?: Lesson[]; // Made optional to match service interface
}

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  topics?: Topic[]; // Made optional to match service interface
}

// --- SUB-COMPONENTS ---

// Course Card Component
const CourseCard: FC<{ course: Course; onClick: () => void }> = ({ course, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer group transform transition-transform duration-300 hover:-translate-y-2"
  >
    <img src={course.imageUrl} alt={course.title} className="w-full h-48 object-cover" />
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
      <p className="text-gray-600 text-sm">{course.description}</p>
    </div>
  </div>
);

// Create New Course Card Component
const CreateCourseCard: FC<{ onClick: () => void }> = ({ onClick }) => (
  <div
    onClick={onClick}
    className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center h-full min-h-[288px] cursor-pointer group transform transition-transform duration-300 hover:-translate-y-2 hover:border-black"
  >
    <div className="text-center text-gray-500 group-hover:text-black transition-colors duration-300">
      <Plus className="mx-auto h-12 w-12" />
      <p className="mt-2 font-semibold">Create New Course</p>
    </div>
  </div>
);

// Course Library View
const CourseLibrary: FC<{ 
  courses: Course[]; 
  loading: boolean; 
  onCourseSelect: (course: Course) => void; 
  onCreateCourse: () => void; 
}> = ({ courses, loading, onCourseSelect, onCreateCourse }) => (
  <div>
    <h1 className="text-4xl font-bold text-gray-900 mb-2">Course Library</h1>
    <p className="text-gray-600 mb-8">Explore your courses or create a new one to get started.</p>
    
    {loading ? (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} onClick={() => onCourseSelect(course)} />
        ))}
        <CreateCourseCard onClick={onCreateCourse} />
      </div>
    )}
  </div>
);

// Course Topics View
const CourseView: FC<{ course: Course; onBack: () => void; onTopicSelect: (topic: Topic) => void }> = ({ course, onBack, onTopicSelect }) => (
  <div>
    <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-600 hover:text-black mb-6 transition-colors duration-300">
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Library
    </button>
    <div className="flex items-start mb-8">
        <img src={course.imageUrl} alt={course.title} className="w-40 h-auto object-cover rounded-xl mr-6" />
        <div>
            <h1 className="text-4xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-2">{course.description}</p>
        </div>
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Topics</h2>
    <div className="space-y-4">
      {course.topics && course.topics.length > 0 ? (
        course.topics.map((topic) => (
          <div 
            key={topic.id} 
            onClick={() => onTopicSelect(topic)}
            className="bg-white p-5 rounded-xl border border-gray-200 cursor-pointer hover:border-black hover:shadow-md transition-all duration-300 flex justify-between items-center"
          >
            <div className="flex items-center">
              <BookOpen className="w-6 h-6 mr-4 text-gray-500"/>
              <span className="font-semibold text-lg">{topic.title}</span>
            </div>
            <span className="text-sm text-gray-500">{topic.lessons?.length || 0} lessons</span>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No topics available for this course yet.</p>
        </div>
      )}
    </div>
  </div>
);

// Topic Lessons View
const TopicView: FC<{ topic: Topic; courseTitle: string; onBack: () => void }> = ({ topic, courseTitle, onBack }) => (
  <div>
    <button onClick={onBack} className="flex items-center text-sm font-semibold text-gray-600 hover:text-black mb-6 transition-colors duration-300">
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to {courseTitle}
    </button>
    <h1 className="text-4xl font-bold text-gray-900">{topic.title}</h1>
    <p className="text-gray-600 mb-8">All lessons for this topic.</p>
    <div className="space-y-3">
      {topic.lessons && topic.lessons.length > 0 ? (
        topic.lessons.map((lesson) => (
          <div key={lesson.id} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center">
            <div className="flex items-center">
              {lesson.type === 'video' ? <Video className="w-5 h-5 mr-4 text-gray-500"/> : <FileText className="w-5 h-5 mr-4 text-gray-500"/>}
              <span className="font-medium">{lesson.title}</span>
            </div>
            {lesson.type === 'video' && lesson.duration && <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{lesson.duration}</span>}
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No lessons available for this topic yet.</p>
        </div>
      )}
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---
function LibraryContent() {
  // State to manage the current view and selected items
  const [view, setView] = useState<'library' | 'course' | 'topic' | 'create'>('library');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock user ID - in a real app, you'd get this from auth context
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  // Load courses on component mount
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const userCourses = await courseService.getCourses(userId);
      setCourses(userCourses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for navigation ---
  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setView('course');
  };

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setView('topic');
  };

  const handleCreateCourse = () => {
    setView('create');
  };

  const handleCourseCreated = (course: Course) => {
    setCourses(prev => [course, ...prev]);
    setView('library');
  };

  const backToLibrary = () => {
    setSelectedCourse(null);
    setSelectedTopic(null);
    setView('library');
  };

  const backToCourse = () => {
    setSelectedTopic(null);
    setView('course');
  };

  // --- Render logic based on state ---
  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={loadCourses}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (view) {
      case 'create':
        return (
          <CourseCreator
            userId={userId}
            onSuccess={handleCourseCreated}
            onCancel={backToLibrary}
          />
        );
      case 'course':
        return selectedCourse && (
          <CourseView 
            course={selectedCourse} 
            onBack={backToLibrary} 
            onTopicSelect={handleTopicSelect} 
          />
        );
      case 'topic':
        return selectedTopic && selectedCourse && (
          <TopicView 
            topic={selectedTopic} 
            courseTitle={selectedCourse.title} 
            onBack={backToCourse} 
          />
        );
      case 'library':
      default:
        return (
          <CourseLibrary 
            courses={courses}
            loading={loading}
            onCourseSelect={handleCourseSelect}
            onCreateCourse={handleCreateCourse}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <DashboardLayout>
      <LibraryContent />
    </DashboardLayout>
  )
}
