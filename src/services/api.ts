/**
 * api.ts — thin facade that routes all App.tsx calls through the
 * real HTTP feature wrappers (apiClient + endpoints.js).
 *
 * The localStorage mock is no longer active in the runtime path.
 */
import apiClient from './apiClient';
import * as adminApi from '../features/admin/admin.api';
import * as authApi from '../features/auth/auth.api';
import * as quizesApi from '../features/quizes/quizes.api';
import * as resultsApi from '../features/results/results.api';
import type { User, Course, Chapter, Quiz, Question, QuizResult, LeaderboardEntry, GlobalLeaderboardEntry } from '../types';

export const getStatsSummary = () =>
  apiClient.get('/stats/summary').then((r) => r.data as { courses: number; chapters: number; quizzes: number; questions: number });

/* ------------------------------------------------------------------ */
/* Auth                                                                 */
/* ------------------------------------------------------------------ */

export const login = (email: string, password: string) =>
  (authApi as any).login(email, password) as Promise<{ user: User; token: string }>;

export const register = (name: string, email: string, password: string) =>
  (authApi as any).register(name, email, password) as Promise<{ user: User; token: string }>;

/* ------------------------------------------------------------------ */
/* Browsing (courses / chapters / quizzes) — shared auth-only routes   */
/* ------------------------------------------------------------------ */

export const getCourses = (): Promise<Course[]> =>
  apiClient.get('/courses').then((r) => r.data);

export const getChapters = (courseId: string): Promise<Chapter[]> =>
  apiClient.get(`/chapters/${courseId}`).then((r) => r.data);

export const getQuizzes = (chapterId: string): Promise<Quiz[]> =>
  apiClient.get(`/quizzes/${chapterId}`).then((r) => r.data);

/* ------------------------------------------------------------------ */
/* Admin — course / chapter / quiz CRUD                                */
/* ------------------------------------------------------------------ */

export const createCourse = (title: string, description: string) =>
  (adminApi as any).createCourse(title, description) as Promise<Course>;

export const updateCourse = (courseId: string, data: Partial<Pick<Course, 'title' | 'description' | 'isPublished'>>) =>
  (adminApi as any).updateCourse(courseId, data) as Promise<Course>;

export const deleteCourse = (courseId: string) =>
  (adminApi as any).deleteCourse(courseId) as Promise<void>;

export const createChapter = (
  courseId: string,
  title: string,
  description: string,
  order?: number
) => (adminApi as any).createChapter(courseId, title, description, order) as Promise<Chapter>;

export const deleteChapter = (chapterId: string) =>
  (adminApi as any).deleteChapter(chapterId) as Promise<void>;

export const createQuiz = (
  chapterId: string,
  courseId: string,
  title: string,
  description: string,
  questionCount: number,
  passingScore: number,
  timeLimit: number
) =>
  (adminApi as any).createQuiz(
    chapterId,
    courseId,
    title,
    description,
    questionCount,
    passingScore,
    timeLimit
  ) as Promise<Quiz>;

export const updateQuiz = (quizId: string, quizData: Partial<Quiz>) =>
  (adminApi as any).updateQuiz(quizId, quizData) as Promise<Quiz>;

export const publishQuiz = (quizId: string) =>
  (adminApi as any).publishQuiz(quizId) as Promise<void>;

export const deleteQuiz = (quizId: string) =>
  (adminApi as any).deleteQuiz(quizId) as Promise<void>;

export const getLeaderboard = (quizId: string) =>
  (adminApi as any).getLeaderboard(quizId) as Promise<LeaderboardEntry[]>;

export const getAllLeaderboard = () =>
  (adminApi as any).getAllLeaderboard() as Promise<GlobalLeaderboardEntry[]>;

/* ------------------------------------------------------------------ */
/* Questions (managed via App.tsx admin question view)                 */
/* ------------------------------------------------------------------ */

export const getQuestions = (quizId: string): Promise<Question[]> =>
  (adminApi as any).getQuestions(quizId);

export const createQuestion = (questionData: Partial<Question>) =>
  (adminApi as any).createQuestion(questionData) as Promise<Question>;

export const updateQuestion = (questionId: string, questionData: Partial<Question>) =>
  (adminApi as any).updateQuestion(questionId, questionData) as Promise<void>;

export const deleteQuestion = (questionId: string) =>
  (adminApi as any).deleteQuestion(questionId) as Promise<void>;

/* ------------------------------------------------------------------ */
/* Student quiz play                                                    */
/* ------------------------------------------------------------------ */

export const getAllPublishedQuizzes = (): Promise<Quiz[]> =>
  (quizesApi as any).getAllPublishedQuizzes();

export const getQuizWithQuestions = (
  quizId: string
): Promise<{ quiz: Quiz; questions: Question[] }> =>
  (quizesApi as any).getQuizWithQuestions(quizId);

export const submitQuiz = (
  quizId: string,
  answers: { questionId: string; selectedOptions: number[] }[],
  timeTaken: number
): Promise<QuizResult> => (quizesApi as any).submitQuiz(quizId, answers, timeTaken);

/* ------------------------------------------------------------------ */
/* Results                                                              */
/* ------------------------------------------------------------------ */

export const getMyResults = (): Promise<QuizResult[]> =>
  (resultsApi as any).getMyResults();

/* ------------------------------------------------------------------ */
/* No-op kept for backward compatibility with any call sites            */
/* ------------------------------------------------------------------ */
export const testConnection = async () => undefined;

