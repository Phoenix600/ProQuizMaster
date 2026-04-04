export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  ADMIN: {
    COURSES: '/admin/courses',
    COURSE_BY_ID: (courseId) => `/admin/courses/${courseId}`,
    CHAPTERS: (courseId) => `/admin/chapters/${courseId}`,
    CHAPTERS_BASE: '/admin/chapters',
    QUIZZES: (chapterId) => `/admin/quizzes/${chapterId}`,
    QUIZZES_BASE: '/admin/quizzes',
    PUBLISH_QUIZ: (quizId) => `/admin/quizzes/${quizId}/publish`,
    QUESTIONS: (quizId) => `/admin/questions/${quizId}`,
    QUESTIONS_BASE: '/admin/questions',
    QUESTION_BY_ID: (questionId) => `/admin/questions/${questionId}`,
    LEADERBOARD: (quizId) => `/admin/leaderboard/${quizId}`,
    LEADERBOARD_ALL: '/admin/leaderboard',
  },
  QUIZ: {
    ALL: '/quiz/all',
    BY_ID: (quizId) => `/quiz/${quizId}`,
    SUBMIT: '/quiz/submit',
  },
  RESULTS: {
    MY_RESULTS: '/results/my-results',
  },
};
