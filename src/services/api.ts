import axios from 'axios';
import { User, Course, Chapter, Quiz, Question, QuizResult, LeaderboardEntry } from '../types';

const instance = axios.create({
  baseURL: '/api',
});

// Authentication
export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  const response = await instance.post('/login', { email, password });
  return response.data;
};

export const register = async (name: string, email: string, password: string): Promise<{ user: User; token: string }> => {
  const response = await instance.post('/register', { name, email, password });
  return response.data;
};

// Admin - Courses
export const getCourses = async (): Promise<Course[]> => {
  const response = await instance.get('/courses');
  return response.data;
};

export const createCourse = async (courseName: string, description: string): Promise<Course> => {
  const response = await instance.post('/courses', { courseName, description });
  return response.data;
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  await instance.delete(`/courses/${courseId}`);
};

export const updateCourse = async (courseId: string, courseName: string, description: string): Promise<Course> => {
  const response = await instance.put(`/courses/${courseId}`, { courseName, description });
  return response.data;
};

// Admin - Chapters
export const getChapters = async (courseId: string): Promise<Chapter[]> => {
  const response = await instance.get('/chapters', { params: { courseId } });
  return response.data;
};

export const createChapter = async (courseId: string, chapterName: string, description: string): Promise<Chapter> => {
  const response = await instance.post('/chapters', { courseId, chapterName, description });
  return response.data;
};

export const deleteChapter = async (chapterId: string): Promise<void> => {
  await instance.delete(`/chapters/${chapterId}`);
};

export const updateChapter = async (chapterId: string, chapterName: string, description: string): Promise<void> => {
  await instance.put(`/chapters/${chapterId}`, { chapterName, description });
};

// Admin - Quizzes
export const getQuizzes = async (chapterId: string): Promise<Quiz[]> => {
  const response = await instance.get('/quizzes', { params: { chapterId } });
  return response.data;
};

export const createQuiz = async (chapterId: string, quizTitle: string, description: string, passingScore: number, timeLimit: number): Promise<Quiz> => {
  const response = await instance.post('/quizzes', { chapterId, quizTitle, description, passingScore, timeLimit });
  return response.data;
};

export const publishQuiz = async (quizId: string): Promise<void> => {
  await instance.put(`/quizzes/${quizId}`, { isPublished: true });
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  await instance.delete(`/quizzes/${quizId}`);
};

export const updateQuiz = async (quizId: string, quizTitle: string, description: string, passingScore: number, timeLimit: number): Promise<void> => {
  await instance.put(`/quizzes/${quizId}`, { quizTitle, description, passingScore, timeLimit });
};

// Admin - Questions
export const getQuestions = async (quizId: string): Promise<Question[]> => {
  const response = await instance.get('/questions', { params: { quizId } });
  return response.data;
};

export const createQuestion = async (questionData: Partial<Question>): Promise<Question> => {
  const response = await instance.post('/questions', questionData);
  return response.data;
};

export const updateQuestion = async (questionId: string, questionData: Partial<Question>): Promise<void> => {
  await instance.put(`/questions/${questionId}`, questionData);
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
  await instance.delete(`/questions/${questionId}`);
};

// Admin - Leaderboard
export const getLeaderboard = async (quizId: string): Promise<LeaderboardEntry[]> => {
  // Mock for now or implement on server
  return [];
};

// Student - Quiz
export const getAllPublishedQuizzes = async (): Promise<Quiz[]> => {
  const response = await instance.get('/quizzes/published');
  return response.data;
};

export const getQuizWithQuestions = async (quizId: string): Promise<{ quiz: Quiz; questions: Question[] }> => {
  const quizResponse = await instance.get(`/quizzes/${quizId}`);
  const questionsResponse = await instance.get('/questions', { params: { quizId } });
  return { quiz: quizResponse.data, questions: questionsResponse.data };
};

export const submitQuiz = async (quizId: string, answers: { questionId: string; selectedOptions: number[] }[], timeTaken: number): Promise<QuizResult> => {
  // Logic to calculate score should ideally be on server, but for now we'll do it on client or mock
  // Let's assume the server handles it or we pass the calculated score
  // For simplicity, let's just send the data
  const userId = JSON.parse(localStorage.getItem('user') || '{}')._id;
  const response = await instance.post('/results', { 
    userId, 
    quizId, 
    score: 0, // Placeholder
    totalQuestions: answers.length, 
    percentage: 0, 
    isPassed: false, 
    timeTaken 
  });
  return response.data;
};

export const getMyResults = async (): Promise<QuizResult[]> => {
  const userId = JSON.parse(localStorage.getItem('user') || '{}')._id;
  const response = await instance.get('/results/me', { params: { userId } });
  return response.data;
};

export const testConnection = async () => {
  // No-op for axios
};
