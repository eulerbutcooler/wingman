export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt';
  size: number;
  uploadedAt: Date;
  userId: string;
  status: 'processing' | 'ready' | 'error';
  url?: string;
  extractedText?: string;
  pageCount?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
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

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  courseId?: string;
  documentId?: string;
  questions: Question[];
  createdAt: Date;
  difficulty: 'easy' | 'medium' | 'hard';
  totalQuestions: number;
  timeLimit?: number;
  latestResult?: QuizResult;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface QuizResult {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, string | string[]>;
  score: number;
  totalQuestions: number;
  completedAt: Date;
  timeSpent?: number;
}

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

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    quizReminders: boolean;
  };
  aiModel: 'gpt-4' | 'claude' | 'gemini';
}
