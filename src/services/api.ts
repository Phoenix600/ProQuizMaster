import { User, Course, Chapter, Quiz, Question, QuizResult, LeaderboardEntry } from '../types';

// Helper to manage localStorage
const STORAGE_KEYS = {
  USERS: 'quiz_app_users',
  COURSES: 'quiz_app_courses',
  CHAPTERS: 'quiz_app_chapters',
  QUIZZES: 'quiz_app_quizzes',
  QUESTIONS: 'quiz_app_questions',
  RESULTS: 'quiz_app_results',
  CURRENT_USER: 'quiz_app_current_user',
  TOKEN: 'token'
};

const getData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setData = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = () => Math.random().toString(36).substring(2, 15);

// Authentication
export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  const users = getData<User>(STORAGE_KEYS.USERS);
  const user = users.find(u => u.email === email);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // In a real app, we'd check password hash
  const token = 'mock-jwt-token-' + generateId();
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  
  return { user, token };
};

export const register = async (name: string, email: string, password: string): Promise<{ user: User; token: string }> => {
  const users = getData<User>(STORAGE_KEYS.USERS);
  if (users.some(u => u.email === email)) {
    throw new Error('User already exists');
  }
  
  const newUser: User = {
    _id: generateId(),
    name,
    email,
    role: email.includes('admin') ? 'admin' : 'student'
  };
  
  users.push(newUser);
  setData(STORAGE_KEYS.USERS, users);
  
  const token = 'mock-jwt-token-' + generateId();
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
  
  return { user: newUser, token };
};

// Admin - Courses
export const getCourses = async (): Promise<Course[]> => {
  return getData<Course>(STORAGE_KEYS.COURSES);
};

export const createCourse = async (title: string, description: string): Promise<Course> => {
  const courses = getData<Course>(STORAGE_KEYS.COURSES);
  const newCourse: Course = {
    _id: generateId(),
    title,
    description
  };
  courses.push(newCourse);
  setData(STORAGE_KEYS.COURSES, courses);
  return newCourse;
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  const courses = getData<Course>(STORAGE_KEYS.COURSES).filter(c => c._id !== courseId);
  setData(STORAGE_KEYS.COURSES, courses);
};

// Admin - Chapters
export const getChapters = async (courseId: string): Promise<Chapter[]> => {
  return getData<Chapter>(STORAGE_KEYS.CHAPTERS).filter(c => c.courseId === courseId);
};

export const createChapter = async (courseId: string, title: string, description: string, order: number = 1): Promise<Chapter> => {
  const chapters = getData<Chapter>(STORAGE_KEYS.CHAPTERS);
  const newChapter: Chapter = {
    _id: generateId(),
    courseId,
    title,
    description,
    order
  };
  chapters.push(newChapter);
  setData(STORAGE_KEYS.CHAPTERS, chapters);
  return newChapter;
};

export const deleteChapter = async (chapterId: string): Promise<void> => {
  const chapters = getData<Chapter>(STORAGE_KEYS.CHAPTERS).filter(c => c._id !== chapterId);
  setData(STORAGE_KEYS.CHAPTERS, chapters);
};

// Admin - Quizzes
export const getQuizzes = async (chapterId: string): Promise<Quiz[]> => {
  return getData<Quiz>(STORAGE_KEYS.QUIZZES).filter(q => q.chapterId === chapterId);
};

export const createQuiz = async (chapterId: string, courseId: string, title: string, description: string, passingScore: number, timeLimit: number): Promise<Quiz> => {
  const quizzes = getData<Quiz>(STORAGE_KEYS.QUIZZES);
  const newQuiz: Quiz = {
    _id: generateId(),
    chapterId,
    courseId,
    title,
    description,
    passingScore,
    timeLimit,
    isPublished: false
  };
  quizzes.push(newQuiz);
  setData(STORAGE_KEYS.QUIZZES, quizzes);
  return newQuiz;
};

export const publishQuiz = async (quizId: string): Promise<void> => {
  const quizzes = getData<Quiz>(STORAGE_KEYS.QUIZZES);
  const quiz = quizzes.find(q => q._id === quizId);
  if (quiz) {
    quiz.isPublished = true;
    setData(STORAGE_KEYS.QUIZZES, quizzes);
  }
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  const quizzes = getData<Quiz>(STORAGE_KEYS.QUIZZES).filter(q => q._id !== quizId);
  setData(STORAGE_KEYS.QUIZZES, quizzes);
};

// Admin - Questions
export const getQuestions = async (quizId: string): Promise<Question[]> => {
  return getData<Question>(STORAGE_KEYS.QUESTIONS).filter(q => q.quizId === quizId);
};

export const createQuestion = async (questionData: Partial<Question>): Promise<Question> => {
  const questions = getData<Question>(STORAGE_KEYS.QUESTIONS);
  const newQuestion: Question = {
    _id: generateId(),
    quizId: questionData.quizId || '',
    questionText: questionData.questionText || '',
    image: questionData.image,
    codeSnippet: questionData.codeSnippet,
    programmingLanguage: questionData.programmingLanguage,
    options: questionData.options || [],
    numberOfCorrectAnswers: questionData.numberOfCorrectAnswers || 0,
    order: questionData.order || 0
  };
  questions.push(newQuestion);
  setData(STORAGE_KEYS.QUESTIONS, questions);
  return newQuestion;
};

export const updateQuestion = async (questionId: string, questionData: Partial<Question>): Promise<void> => {
  const questions = getData<Question>(STORAGE_KEYS.QUESTIONS);
  const index = questions.findIndex(q => q._id === questionId);
  if (index !== -1) {
    questions[index] = { ...questions[index], ...questionData };
    setData(STORAGE_KEYS.QUESTIONS, questions);
  }
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
  const questions = getData<Question>(STORAGE_KEYS.QUESTIONS).filter(q => q._id !== questionId);
  setData(STORAGE_KEYS.QUESTIONS, questions);
};

// Admin - Leaderboard
export const getLeaderboard = async (quizId: string): Promise<LeaderboardEntry[]> => {
  const results = getData<QuizResult>(STORAGE_KEYS.RESULTS).filter(r => r.quizId === quizId);
  const users = getData<User>(STORAGE_KEYS.USERS);
  
  return results.map(r => {
    const user = users.find(u => u._id === r.userId);
    return {
      userName: user?.name || 'Unknown',
      score: r.score,
      percentage: r.percentage,
      timeTaken: r.timeTaken,
      createdAt: r.createdAt
    };
  }).sort((a, b) => b.percentage - a.percentage);
};

// Student - Quiz
export const getAllPublishedQuizzes = async (): Promise<Quiz[]> => {
  return getData<Quiz>(STORAGE_KEYS.QUIZZES).filter(q => q.isPublished);
};

export const getQuizWithQuestions = async (quizId: string): Promise<{ quiz: Quiz; questions: Question[] }> => {
  const quizzes = getData<Quiz>(STORAGE_KEYS.QUIZZES);
  const quiz = quizzes.find(q => q._id === quizId);
  if (!quiz) throw new Error('Quiz not found');
  
  const questions = getData<Question>(STORAGE_KEYS.QUESTIONS).filter(q => q.quizId === quizId);
  return { quiz, questions };
};

export const submitQuiz = async (quizId: string, answers: { questionId: string; selectedOptions: number[] }[], timeTaken: number): Promise<QuizResult> => {
  const { quiz, questions } = await getQuizWithQuestions(quizId);
  const currentUserStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  
  if (!currentUser) throw new Error('User not authenticated');

  let score = 0;
  answers.forEach(answer => {
    const question = questions.find(q => q._id === answer.questionId);
    if (question) {
      const correctOptionIndices = question.options
        .map((opt, idx) => opt.isCorrect ? idx : -1)
        .filter(idx => idx !== -1);
      
      const isCorrect = correctOptionIndices.length === answer.selectedOptions.length &&
        correctOptionIndices.every(opt => answer.selectedOptions.includes(opt));
      
      if (isCorrect) score++;
    }
  });

  const percentage = (score / questions.length) * 100;
  const isPassed = percentage >= quiz.passingScore;

  const result: QuizResult = {
    _id: generateId(),
    userId: currentUser._id,
    quizId,
    score,
    totalQuestions: questions.length,
    percentage,
    isPassed,
    timeTaken,
    createdAt: new Date().toISOString()
  };

  const results = getData<QuizResult>(STORAGE_KEYS.RESULTS);
  results.push(result);
  setData(STORAGE_KEYS.RESULTS, results);

  return result;
};

export const getMyResults = async (): Promise<QuizResult[]> => {
  const currentUserStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  if (!currentUser) return [];
  
  return getData<QuizResult>(STORAGE_KEYS.RESULTS).filter(r => r.userId === currentUser._id);
};

export const testConnection = async () => {
  // No-op
};

// Initialize dummy data if storage is empty
const initializeDummyData = () => {
  const users = getData<User>(STORAGE_KEYS.USERS);
  if (users.length > 0) return; // Already initialized

  console.log('Initializing dummy data...');

  const adminId = 'admin-1';
  const studentId = 'student-1';

  const dummyUsers: User[] = [
    { _id: adminId, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
    { _id: studentId, name: 'Student User', email: 'student@example.com', role: 'student' }
  ];
  setData(STORAGE_KEYS.USERS, dummyUsers);

  const course1Id = 'course-1';
  const course2Id = 'course-2';
  const dummyCourses: Course[] = [
    { _id: course1Id, title: 'Full Stack Web Development', description: 'Master the modern web from frontend to backend.' },
    { _id: course2Id, title: 'Advanced React Patterns', description: 'Deep dive into React hooks, context, and performance.' }
  ];
  setData(STORAGE_KEYS.COURSES, dummyCourses);

  const chapter1Id = 'chapter-1';
  const chapter2Id = 'chapter-2';
  const dummyChapters: Chapter[] = [
    { _id: chapter1Id, courseId: course1Id, title: 'HTML & CSS Basics', description: 'Structure and style the web.', order: 1 },
    { _id: chapter2Id, courseId: course2Id, title: 'React Hooks', description: 'Learn useState, useEffect, and custom hooks.', order: 1 }
  ];
  setData(STORAGE_KEYS.CHAPTERS, dummyChapters);

  const quiz1Id = 'quiz-1';
  const quiz2Id = 'quiz-2';
  const dummyQuizzes: Quiz[] = [
    { _id: quiz1Id, chapterId: chapter1Id, courseId: course1Id, title: 'HTML Quiz', description: 'Test your HTML knowledge.', passingScore: 70, timeLimit: 10, isPublished: true },
    { _id: quiz2Id, chapterId: chapter2Id, courseId: course2Id, title: 'Hooks Quiz', description: 'Test your React Hooks knowledge.', passingScore: 80, timeLimit: 15, isPublished: true }
  ];
  setData(STORAGE_KEYS.QUIZZES, dummyQuizzes);

  const dummyQuestions: Question[] = [
    {
      _id: 'q1',
      quizId: quiz1Id,
      questionText: 'What does HTML stand for?',
      options: [
        { text: 'Hyper Text Markup Language', isCorrect: true },
        { text: 'High Tech Modern Language', isCorrect: false },
        { text: 'Hyper Transfer Markup Language', isCorrect: false },
        { text: 'Home Tool Markup Language', isCorrect: false }
      ],
      numberOfCorrectAnswers: 1,
      order: 1
    },
    {
      _id: 'q2',
      quizId: quiz1Id,
      questionText: 'Which HTML element is used for the largest heading?',
      options: [
        { text: '<head>', isCorrect: false },
        { text: '<h6>', isCorrect: false },
        { text: '<h1>', isCorrect: true },
        { text: '<heading>', isCorrect: false }
      ],
      numberOfCorrectAnswers: 1,
      order: 2
    },
    {
      _id: 'q3',
      quizId: quiz2Id,
      questionText: 'Which hook is used to manage side effects in React?',
      options: [
        { text: 'useState', isCorrect: false },
        { text: 'useContext', isCorrect: false },
        { text: 'useEffect', isCorrect: true },
        { text: 'useReducer', isCorrect: false }
      ],
      numberOfCorrectAnswers: 1,
      order: 1
    },
    {
      _id: 'q4',
      quizId: quiz2Id,
      questionText: 'What is the correct way to update state in React?',
      options: [
        { text: 'this.state.value = newValue', isCorrect: false },
        { text: 'setState(newValue)', isCorrect: true },
        { text: 'state = newValue', isCorrect: false },
        { text: 'updateState(newValue)', isCorrect: false }
      ],
      numberOfCorrectAnswers: 1,
      order: 2
    }
  ];
  setData(STORAGE_KEYS.QUESTIONS, dummyQuestions);
};

// Auto-initialize
if (typeof window !== 'undefined') {
  initializeDummyData();
}
