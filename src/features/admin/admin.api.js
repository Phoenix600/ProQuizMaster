import apiClient from '../../services/apiClient';
import { ENDPOINTS } from '../../services/endpoints';

export const getCourses = async () => {
  const response = await apiClient.get(ENDPOINTS.ADMIN.COURSES);
  return response.data;
};

export const createCourse = async (title, description) => {
  const response = await apiClient.post(ENDPOINTS.ADMIN.COURSES, { title, description });
  return response.data;
};

export const updateCourse = async (courseId, data) => {
  const response = await apiClient.patch(ENDPOINTS.ADMIN.COURSE_BY_ID(courseId), data);
  return response.data;
};

export const deleteCourse = async (courseId) => {
  await apiClient.delete(`${ENDPOINTS.ADMIN.COURSES}/${courseId}`);
};

export const getChapters = async (courseId) => {
  const response = await apiClient.get(ENDPOINTS.ADMIN.CHAPTERS(courseId));
  return response.data;
};

export const createChapter = async (courseId, title, description, order = 1) => {
  const response = await apiClient.post(ENDPOINTS.ADMIN.CHAPTERS_BASE, { courseId, title, description, order });
  return response.data;
};

export const deleteChapter = async (chapterId) => {
  await apiClient.delete(`${ENDPOINTS.ADMIN.CHAPTERS_BASE}/${chapterId}`);
};

export const getQuizzes = async (chapterId) => {
  const response = await apiClient.get(ENDPOINTS.ADMIN.QUIZZES(chapterId));
  return response.data;
};

export const createQuiz = async (chapterId, courseId, title, description, questionCount, passingScore, timeLimit) => {
  const response = await apiClient.post(ENDPOINTS.ADMIN.QUIZZES_BASE, { chapterId, courseId, title, description, questionCount, passingScore, timeLimit });
  return response.data;
};

export const updateQuiz = async (quizId, quizData) => {
  const response = await apiClient.patch(`${ENDPOINTS.ADMIN.QUIZZES_BASE}/${quizId}`, quizData);
  return response.data;
};

export const publishQuiz = async (quizId) => {
  await apiClient.patch(ENDPOINTS.ADMIN.PUBLISH_QUIZ(quizId));
};

export const deleteQuiz = async (quizId) => {
  await apiClient.delete(`${ENDPOINTS.ADMIN.QUIZZES_BASE}/${quizId}`);
};

export const getQuestions = async (quizId) => {
  const response = await apiClient.get(ENDPOINTS.ADMIN.QUESTIONS(quizId));
  return response.data;
};

export const createQuestion = async (questionData) => {
  const response = await apiClient.post(ENDPOINTS.ADMIN.QUESTIONS_BASE, questionData);
  return response.data;
};

export const updateQuestion = async (questionId, questionData) => {
  await apiClient.patch(ENDPOINTS.ADMIN.QUESTION_BY_ID(questionId), questionData);
};

export const deleteQuestion = async (questionId) => {
  await apiClient.delete(ENDPOINTS.ADMIN.QUESTION_BY_ID(questionId));
};

export const getLeaderboard = async (quizId) => {
  const response = await apiClient.get(ENDPOINTS.ADMIN.LEADERBOARD(quizId));
  return response.data;
};

export const getAllLeaderboard = async () => {
  const response = await apiClient.get(ENDPOINTS.ADMIN.LEADERBOARD_ALL);
  return response.data;
};
