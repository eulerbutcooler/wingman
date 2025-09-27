export interface Document {
  id: string;
  name: string;
  type: "pdf" | "docx" | "txt";
  size: number;
  uploadedAt: Date;
  userId: string;
  status: "processing" | "ready" | "error";
  url?: string;
  extractedText?: string;
  pageCount?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  citations?: Citation[];
  documentId?: string;
}

export interface Citation {
  id: string;
  text: string;
  page: number;
  documentId: string;
  documentName: string;
  confidence: number;
}

// ============================================================================
// USER TYPES (Database integer primary keys + Supabase UUID)
// ============================================================================

export interface User {
  id: number;
  supabaseId: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: number; // Database integer ID
  supabaseId: string; // Supabase Auth UUID
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    quizReminders: boolean;
  };
  aiModel: "gpt-4" | "claude" | "gemini";
}

// ============================================================================
// COURSE TYPES (Updated to use integer primary keys)
// ============================================================================

export interface Course {
  id: number;
  userId: number;
  title: string;
  description?: string;
  gendesc?: string; // AI-generated description
  image?: string;
  imageUrl?: string; // Backward compatibility
  createdAt: Date;
  updatedAt: Date;
  topics?: Topic[];
}

export interface Topic {
  id: number;
  courseId: number;
  title: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  topicId: number;
  title: string;
  type: "pdf" | "docx" | "pptx";
  fileId?: string;
  duration?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseData {
  title: string;
  description?: string;
  image?: string;
  imageUrl?: string; // Backward compatibility
  topics?: {
    title: string;
    lessons?: {
      title: string;
      type: "pdf" | "docx" | "pptx";
      fileId?: string;
      duration?: string;
    }[];
  }[];
}

// ============================================================================
// QUIZ TYPES
// ============================================================================

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  courseId?: string;
  documentId?: string;
  questions: Question[];
  createdAt: Date;
  difficulty: "easy" | "medium" | "hard";
  totalQuestions: number;
  timeLimit?: number;
  latestResult?: QuizResult;
  userId: number; // Updated to use integer ID
}

export interface Question {
  id: string;
  type: "multiple-choice" | "true-false" | "fill-blank" | "short-answer";
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface QuizResult {
  id: string;
  quizId: string;
  userId: number; // Updated to use integer ID
  answers: Record<string, string | string[]>;
  score: number;
  totalQuestions: number;
  completedAt: Date;
  timeSpent?: number;
}

// ============================================================================
// FILE TYPES
// ============================================================================

export interface UploadedFile {
  id: number;
  userId?: number;
  lessonId?: number;
  fileName: string;
  originalName?: string; // Backward compatibility
  filename?: string; // Backward compatibility
  fileUrl: string;
  url?: string; // Backward compatibility
  fileType: string;
  type?: "pdf" | "docx" | "pptx"; // Backward compatibility
  fileSize: number;
  size?: number; // Backward compatibility
  uploadStatus: "pending" | "completed" | "failed";
  duration?: string;
  pageCount?: number;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: "pdf" | "docx" | "pptx";
}

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

// ============================================================================
// ADDITIONAL TYPES
// ============================================================================

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  channelTitle: string;
  publishedAt: Date;
  transcript?: string;
  relatedTopics: string[];
}

export interface StudySession {
  id: string;
  userId: string;
  documentIds: string[];
  videoIds: string[];
  startTime: Date;
  endTime?: Date;
  notes: string;
  progress: Record<string, number>;
}
