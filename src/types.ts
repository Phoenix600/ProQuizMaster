export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  isPublished: boolean;
}

export interface Chapter {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
}

export interface Quiz {
  _id: string;
  chapterId: string;
  courseId: string;
  title: string;
  description: string;
  questionCount: number;
  passingScore: number;
  timeLimit: number; // in minutes
  isPublished: boolean;
}

export interface Option {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  _id: string;
  quizId: string;
  questionText: string;
  image?: string;
  codeSnippet?: string;
  programmingLanguage?: string;
  options: Option[];
  numberOfCorrectAnswers: number;
  order: number;
}

export interface QuizResult {
  _id: string;
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  isPassed: boolean;
  timeTaken: number; // in seconds
  createdAt: string;
}

export interface LeaderboardEntry {
  userName: string;
  score: number;
  timeTaken: number;
  percentage: number;
  createdAt: string;
}

export interface GlobalLeaderboardEntry {
  userName: string;
  userEmail: string;
  quizTitle: string;
  quizId: string | null;
  score: number;
  totalQuestions: number;
  percentage: number;
  isPassed: boolean;
  timeTaken: number;
  createdAt: string;
}
