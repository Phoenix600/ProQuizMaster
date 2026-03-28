import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  getDocFromServer,
  onSnapshot
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { User, Course, Chapter, Quiz, Question, QuizResult, LeaderboardEntry } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication
export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }
    
    const userData = userDoc.data() as User;
    const token = await firebaseUser.getIdToken();
    return { user: { ...userData, _id: firebaseUser.uid }, token };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (name: string, email: string, password: string): Promise<{ user: User; token: string }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    const newUser: User = {
      _id: firebaseUser.uid,
      name,
      email,
      role: 'student'
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    const token = await firebaseUser.getIdToken();
    return { user: newUser, token };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Admin - Courses
export const getCourses = async (): Promise<Course[]> => {
  const path = 'courses';
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id } as Course));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const createCourse = async (courseName: string, description: string): Promise<Course> => {
  const path = 'courses';
  try {
    const docRef = await addDoc(collection(db, path), { courseName, description });
    return { _id: docRef.id, courseName, description };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  const path = `courses/${courseId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const updateCourse = async (courseId: string, courseName: string, description: string): Promise<Course> => {
  const path = `courses/${courseId}`;
  try {
    await updateDoc(doc(db, 'courses', courseId), { courseName, description });
    return { _id: courseId, courseName, description };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

// Admin - Chapters
export const getChapters = async (courseId: string): Promise<Chapter[]> => {
  const path = 'chapters';
  try {
    const q = query(collection(db, path), where('courseId', '==', courseId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id } as Chapter));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const createChapter = async (courseId: string, chapterName: string, description: string): Promise<Chapter> => {
  const path = 'chapters';
  try {
    const docRef = await addDoc(collection(db, path), { courseId, chapterName, description });
    return { _id: docRef.id, courseId, chapterName, description };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const deleteChapter = async (chapterId: string): Promise<void> => {
  const path = `chapters/${chapterId}`;
  try {
    await deleteDoc(doc(db, 'chapters', chapterId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const updateChapter = async (chapterId: string, chapterName: string, description: string): Promise<Chapter> => {
  const path = `chapters/${chapterId}`;
  try {
    await updateDoc(doc(db, 'chapters', chapterId), { chapterName, description });
    const chapterDoc = await getDoc(doc(db, 'chapters', chapterId));
    return { ...chapterDoc.data(), _id: chapterId } as Chapter;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

// Admin - Quizzes
export const getQuizzes = async (chapterId: string): Promise<Quiz[]> => {
  const path = 'quizzes';
  try {
    const q = query(collection(db, path), where('chapterId', '==', chapterId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id } as Quiz));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const createQuiz = async (chapterId: string, quizTitle: string, description: string, passingScore: number, timeLimit: number): Promise<Quiz> => {
  const path = 'quizzes';
  try {
    const docRef = await addDoc(collection(db, path), { 
      chapterId, 
      quizTitle, 
      description, 
      passingScore, 
      timeLimit,
      isPublished: false 
    });
    return { _id: docRef.id, chapterId, quizTitle, description, passingScore, timeLimit, isPublished: false };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const publishQuiz = async (quizId: string): Promise<Quiz> => {
  const path = `quizzes/${quizId}`;
  try {
    await updateDoc(doc(db, 'quizzes', quizId), { isPublished: true });
    const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
    return { ...quizDoc.data(), _id: quizId } as Quiz;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

export const deleteQuiz = async (quizId: string): Promise<void> => {
  const path = `quizzes/${quizId}`;
  try {
    await deleteDoc(doc(db, 'quizzes', quizId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const updateQuiz = async (quizId: string, quizTitle: string, description: string, passingScore: number, timeLimit: number): Promise<Quiz> => {
  const path = `quizzes/${quizId}`;
  try {
    await updateDoc(doc(db, 'quizzes', quizId), { quizTitle, description, passingScore, timeLimit });
    const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
    return { ...quizDoc.data(), _id: quizId } as Quiz;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

// Admin - Questions
export const getQuestions = async (quizId: string): Promise<Question[]> => {
  const path = 'questions';
  try {
    const q = query(collection(db, path), where('quizId', '==', quizId), orderBy('order'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id } as Question));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const createQuestion = async (questionData: Partial<Question>): Promise<Question> => {
  const path = 'questions';
  try {
    const docRef = await addDoc(collection(db, path), questionData);
    return { ...questionData, _id: docRef.id } as Question;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const updateQuestion = async (questionId: string, questionData: Partial<Question>): Promise<Question> => {
  const path = `questions/${questionId}`;
  try {
    await updateDoc(doc(db, 'questions', questionId), questionData);
    const questionDoc = await getDoc(doc(db, 'questions', questionId));
    return { ...questionDoc.data(), _id: questionId } as Question;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
  const path = `questions/${questionId}`;
  try {
    await deleteDoc(doc(db, 'questions', questionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Admin - Leaderboard
export const getLeaderboard = async (quizId: string): Promise<LeaderboardEntry[]> => {
  const path = 'results';
  try {
    const q = query(collection(db, path), where('quizId', '==', quizId), orderBy('percentage', 'desc'), orderBy('timeTaken', 'asc'));
    const snapshot = await getDocs(q);
    
    const entries: LeaderboardEntry[] = [];
    for (const d of snapshot.docs) {
      const data = d.data();
      const userDoc = await getDoc(doc(db, 'users', data.userId));
      const userName = userDoc.exists() ? (userDoc.data() as User).name : 'Unknown User';
      entries.push({
        userName,
        score: data.score,
        timeTaken: data.timeTaken,
        percentage: data.percentage,
        createdAt: data.createdAt.toDate().toISOString()
      });
    }
    return entries;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

// Student - Quiz
export const getAllPublishedQuizzes = async (): Promise<Quiz[]> => {
  const path = 'quizzes';
  try {
    const q = query(collection(db, path), where('isPublished', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), _id: doc.id } as Quiz));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const getQuizWithQuestions = async (quizId: string): Promise<{ quiz: Quiz; questions: Question[] }> => {
  try {
    const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
    if (!quizDoc.exists()) throw new Error('Quiz not found');
    
    const questions = await getQuestions(quizId);
    return { 
      quiz: { ...quizDoc.data(), _id: quizId } as Quiz, 
      questions 
    };
  } catch (error) {
    console.error('Error fetching quiz with questions:', error);
    throw error;
  }
};

export const submitQuiz = async (quizId: string, answers: { questionId: string; selectedOptions: number[] }[], timeTaken: number): Promise<QuizResult> => {
  const path = 'results';
  try {
    const { quiz, questions } = await getQuizWithQuestions(quizId);
    
    let score = 0;
    questions.forEach(q => {
      const userAnswer = answers.find(a => a.questionId === q._id);
      if (userAnswer) {
        const correctOptions = q.options
          .map((o, i) => o.isCorrect ? i : -1)
          .filter(i => i !== -1);
        
        const isCorrect = correctOptions.length === userAnswer.selectedOptions.length &&
          correctOptions.every(val => userAnswer.selectedOptions.includes(val));
        
        if (isCorrect) score++;
      }
    });
    
    const percentage = (score / questions.length) * 100;
    const isPassed = percentage >= quiz.passingScore;
    
    const resultData = {
      userId: auth.currentUser?.uid,
      quizId,
      score,
      totalQuestions: questions.length,
      percentage,
      isPassed,
      timeTaken,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, path), resultData);
    return { ...resultData, _id: docRef.id, createdAt: resultData.createdAt.toDate().toISOString() } as QuizResult;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

// Student - Results
export const getMyResults = async (): Promise<QuizResult[]> => {
  const path = 'results';
  try {
    if (!auth.currentUser) return [];
    const q = query(collection(db, path), where('userId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { ...data, _id: doc.id, createdAt: data.createdAt.toDate().toISOString() } as QuizResult;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const getResultDetails = async (resultId: string): Promise<QuizResult> => {
  const path = `results/${resultId}`;
  try {
    const resultDoc = await getDoc(doc(db, 'results', resultId));
    if (!resultDoc.exists()) throw new Error('Result not found');
    const data = resultDoc.data();
    return { ...data, _id: resultId, createdAt: data.createdAt.toDate().toISOString() } as QuizResult;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
};

export const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}

import { setDoc } from 'firebase/firestore';
