'use client';
import React, { useState, useEffect } from 'react';
import type { FC } from 'react';
import DashboardLayout from '@/components/layout';
import CourseCreator from '@/components/CourseCreator';
import { FaPlus } from "react-icons/fa6";
import Image from 'next/image';
import { 
  courseService, 
  type Course as CourseType, 
  type Topic as TopicType, 
  type Lesson as LessonType 
} from '@/lib/services/course-service';
import { div } from 'framer-motion/client';

// Icons
const Icons = {
  Plus: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  
  ArrowLeft: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  ),
  
  BookOpen: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  ),
  
  Video: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m22 8-6 4 6 4V8z"></path>
      <rect x="2" y="6" width="14" height="12" rx="2" ry="2"></rect>
    </svg>
  ),
  
  FileText: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  
  Presentation: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
  ),

  ExternalLink: ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  )
};

// Types
interface Lesson extends LessonType {
  lessons?: Lesson[];
}

interface Topic extends TopicType {
  lessons?: Lesson[];
}

interface Course extends CourseType {
  topics?: Topic[];
}

type ViewType = 'library' | 'course' | 'topic' | 'create';

export default function LibraryPage() {
  const [view, setView] = useState<ViewType>('library');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const userId = '550e8400-e29b-41d4-a716-446655440000';

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

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setView('course');
  };

  const handleCourseDelete = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to delete this course? This will also delete all associated quizzes and cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await courseService.deleteCourse(courseId, userId);
      
      // Remove the course from the local state
      setCourses(courses.filter(course => course.id !== courseId));
      
      // If the deleted course was currently selected, go back to library
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
        setView('library');
      }
      
      console.log('Course deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
      console.error('Failed to delete course:', err);
    } finally {
      setLoading(false);
    }
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

  // Components
  const CourseCard: FC<{ course: Course; onClick: () => void }> = ({ course, onClick }) => (
    <div
      onClick={onClick}
      className="bg-white rounded-4xl  shadow-sm overflow-hidden cursor-pointer group  transition-all duration-300 hover:shadow-xl"
    >
      <img src={course.imageUrl} alt={course.title.charAt(0).toUpperCase() + course.title.slice(1)}  className="w-full h-32 object-cover" />
      <div className=" p-6">
        <h3 className="text-xl font-semibold text-black mb-2">{course.title.charAt(0).toUpperCase() + course.title.slice(1)}</h3>
        <p className="text-navy text-base">{course.description.charAt(0).toUpperCase() + course.description.slice(1)}</p>
      </div>
    </div>
  );

  const CreateCourseCard: FC<{ onClick: () => void }> = ({ onClick }) => (
    <div
      onClick={onClick}
      className='flex gap-4 text-neutral-600 hover:text-black cursor-pointer items-center pr-4'
    >
      Add a new course
      <span className='text-xl'><FaPlus/></span>
    </div>
  );

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
          <div className='flex flex-col items-center bg-[#f5f5f5] min-h-screen w-[100vw]'>
            <div className='w-11/12 pt-34 px-6'>
            <div className='flex justify-between'>
              <button onClick={backToLibrary} className="flex items-center cursor-pointer font-semibold text-gray-600 hover:text-black mb-6 transition-colors duration-300">
              <Icons.ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </button>
            <button className={`flex items-center cursor-pointer font-semibold text-right transition-colors duration-300 mb-6 ${
                      loading ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-800'
                    }`}
                    onClick={() => selectedCourse && !loading && handleCourseDelete(selectedCourse.id)}
                    disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </button>

            </div>
            
            <div className="flex items-start mb-8">
              <img src={selectedCourse.imageUrl} alt={selectedCourse.title} className="w-40 h-auto object-cover rounded-4xl mr-6" />
              <div>
                <h1 className="text-4xl font-bold text-black">{selectedCourse.title.charAt(0).toUpperCase() + selectedCourse.title.slice(1)}</h1>
                <p className="text-neutral-600 mt-2">{selectedCourse.description.charAt(0).toUpperCase() + selectedCourse.description.slice(1)}</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-black mb-4 border-b-[1px] border-gray-600/50 pb-2">Topics</h2>
            <div className="space-y-4 mb-14">
              {selectedCourse.topics && selectedCourse.topics.length > 0 ? (
                selectedCourse.topics.map((topic) => (
                  <div 
                    key={topic.id} 
                    onClick={() => handleTopicSelect(topic)}
                    className="bg-white p-5 rounded-4xl  cursor-pointer hover:shadow-xl shadow-sm transition-all duration-300 flex justify-between items-center"
                  >
                    <div className="flex items-center">
                      <Icons.BookOpen className="w-6 h-6 mr-4 text-gray-600"/>
                      <span className="font-semibold text-lg">{topic.title}</span>
                    </div>
                    <span className="text-sm text-gray-600">{topic.lessons?.length || 0} lessons</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Icons.BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No topics available for this course yet.</p>
                </div>
              )}
            </div>
          </div>
          </div>
        );

      case 'topic':
        return selectedTopic && selectedCourse && (
          <div className='flex flex-col items-center bg-[#f5f5f5] min-h-screen w-[100vw]'>
            <div className='w-11/12 pt-34 px-6'>
            <button onClick={backToCourse} className="flex items-center cursor-pointer font-semibold text-gray-600 hover:text-black mb-6 transition-colors duration-300">
              <Icons.ArrowLeft className="w-4 h-4 mr-2" />
              Back to {selectedCourse.title}
            </button>
            <h1 className="text-4xl font-bold mb-4 text-black">{selectedTopic.title.charAt(0).toUpperCase() + selectedTopic.title.slice(1)}</h1>
            <p className="text-neutral-600 border-b-gray-600/50 border-b-[1px] mb-4 pb-4">All lessons for this topic.</p>
            <div className="space-y-3 mb-14">
              {selectedTopic.lessons && selectedTopic.lessons.length > 0 ? (
                selectedTopic.lessons.map((lesson) => (
                  <div key={lesson.id} className="bg-white p-4 px-6 cursor-pointer rounded-4xl shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {lesson.type === 'video' ? (
                          <Icons.Video className="w-5 h-5 mr-4 text-blue-500"/> 
                        ) : lesson.type === 'pptx' ? (
                          <Icons.Presentation className="w-5 h-5 mr-4 text-orange-500"/>
                        ) : (
                          <Icons.FileText className="w-5 h-5 mr-4 text-red-500"/>
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">{lesson.title.charAt(0).toUpperCase() + lesson.title.slice(1)}</span>
                          <span className="text-xs text-gray-400 capitalize">{lesson.type} file</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {lesson.type === 'video' && lesson.duration && (
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{lesson.duration}</span>
                        )}
                        {lesson.fileUrl && (
                          <a
                            href={lesson.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icons.ExternalLink className="w-4 h-4 mr-1" />
                            Open File
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Icons.FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No lessons available for this topic yet.</p>
                </div>
              )}
            </div>
          </div>
          </div>
        );

      case 'library':
      default:
        return (
          <div className='flex flex-col items-center bg-[#f5f5f5] min-h-screen w-[100vw]'>
            <div className='w-11/12 px-6 pt-34 '>
              <div className='flex justify-between items-center '>
                <div><h1 className='text-left text-2xl font-semibold'>Library</h1>
              <p className="text-gray-600- text-left mt-4 mb-6">Explore your courses or create a new one to get started.</p></div>
              <CreateCourseCard onClick={handleCreateCourse} />
              </div>
              {loading ? (
                <div className="flex justify-center text-xl h-[50vh] items-center">
                  <div className="loader"></div>
                </div>
              ) : (
                <div className='rounded-4xl w-full  py-8 mb-14'>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                    {courses.map((course) => (
                      <CourseCard key={course.id} course={course} onClick={() => handleCourseSelect(course)} />
                    ))}
                    
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
}
