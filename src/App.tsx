import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from '@monaco-editor/react';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  LayoutDashboard,
  Edit,
  Save,
  PlayCircle,
  Settings,
  Code,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Layers,
  LogOut,
  User as UserIcon,
  Search,
  Filter,
  MoreVertical,
  PlusCircle,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import * as api from './services/api';
import { User, Course, Chapter, Quiz, Question, Option, QuizResult, LeaderboardEntry } from './types';

type View = 'home' | 'selection' | 'quiz' | 'admin' | 'results' | 'login';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
            <p className="text-gray-400 text-sm">
              {this.state.error?.message || "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [view, setView] = useState<View>('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Hierarchy state
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseChapters, setCourseChapters] = useState<Record<string, Chapter[]>>({});
  const [chapterQuizzes, setChapterQuizzes] = useState<Record<string, Quiz[]>>({});
  
  // Selection state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  
  // Admin selection state
  const [adminSelectedCourse, setAdminSelectedCourse] = useState<Course | null>(null);
  const [adminSelectedChapter, setAdminSelectedChapter] = useState<Chapter | null>(null);
  const [adminSelectedQuiz, setAdminSelectedQuiz] = useState<Quiz | null>(null);
  const [adminView, setAdminView] = useState<'hierarchy' | 'questions'>('hierarchy');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizDuration, setQuizDuration] = useState(0);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // New Admin Form States
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseData, setNewCourseData] = useState({ title: '', description: '' });
  
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterData, setNewChapterData] = useState({ title: '', description: '' });
  
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [newQuizData, setNewQuizData] = useState({ title: '', description: '', passingScore: 70, timeLimit: 15 });

  // Admin form state
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    quizId: '',
    questionText: '',
    image: '',
    codeSnippet: '',
    programmingLanguage: 'javascript',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    numberOfCorrectAnswers: 1,
    order: 1
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAdmin(user.role === 'admin');
    }
    setIsAuthReady(true);
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isAuthReady) {
      setIsLoading(false);
    }
  }, [isAuthReady]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === 'quiz' && timeLeft > 0 && !isSubmitted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (view === 'quiz' && timeLeft === 0 && !isSubmitted) {
      submitQuiz();
    }
    return () => clearInterval(timer);
  }, [view, timeLeft, isSubmitted]);

  const fetchInitialData = async () => {
    try {
      const coursesData = await api.getCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const fetchChaptersForCourse = async (courseId: string) => {
    try {
      const chaptersData = await api.getChapters(courseId);
      setCourseChapters(prev => ({ ...prev, [courseId]: chaptersData }));
      return chaptersData;
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
      return [];
    }
  };

  const fetchQuizzesForChapter = async (chapterId: string) => {
    try {
      const quizzesData = await api.getQuizzes(chapterId);
      setChapterQuizzes(prev => ({ ...prev, [chapterId]: quizzesData }));
      return quizzesData;
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      return [];
    }
  };

  const toggleCourseExpansion = async (courseId: string) => {
    const isExpanding = !expandedCourses[courseId];
    setExpandedCourses(prev => ({ ...prev, [courseId]: isExpanding }));
    
    if (isExpanding && !courseChapters[courseId]) {
      await fetchChaptersForCourse(courseId);
    }
  };

  const toggleChapterExpansion = async (chapterId: string) => {
    const isExpanding = !expandedChapters[chapterId];
    setExpandedChapters(prev => ({ ...prev, [chapterId]: isExpanding }));
    
    if (isExpanding && !chapterQuizzes[chapterId]) {
      await fetchQuizzesForChapter(chapterId);
    }
  };

  const startQuiz = async (quizId: string) => {
    try {
      setIsLoading(true);
      const { quiz, questions: quizQuestions } = await api.getQuizWithQuestions(quizId);
      setQuestions(quizQuestions);
      setSelectedQuiz(quiz);
      
      const duration = quiz.timeLimit * 60;
      setTimeLeft(duration);
      setQuizDuration(duration);
      
      setCurrentQuestionIndex(0);
      setAnswers({});
      setIsSubmitted(false);
      setView('quiz');
    } catch (error) {
      console.error('Failed to start quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!selectedQuiz) return;
    try {
      setIsLoading(true);
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptions]) => ({
        questionId,
        selectedOptions
      }));
      
      const result = await api.submitQuiz(selectedQuiz._id, formattedAnswers, quizDuration - timeLeft);
      setQuizResult(result);
      setIsSubmitted(true);
      setView('results');
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSelectedQuiz) return;
    
    if (editingQuestionId) {
      handleUpdateQuestion(e);
      return;
    }
    
    try {
      setIsLoading(true);
      await api.createQuestion({
        ...newQuestion,
        quizId: adminSelectedQuiz._id
      });
      
      setNewQuestion({
        questionText: '',
        codeSnippet: '',
        programmingLanguage: 'javascript',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ],
        numberOfCorrectAnswers: 1,
        order: (questions.length + 1)
      });
      
      const questionsData = await api.getQuestions(adminSelectedQuiz._id);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Failed to add question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestionId || !adminSelectedQuiz) return;
    
    try {
      setIsLoading(true);
      await api.updateQuestion(editingQuestionId, newQuestion);
      setEditingQuestionId(null);
      
      setNewQuestion({
        questionText: '',
        codeSnippet: '',
        programmingLanguage: 'javascript',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ],
        numberOfCorrectAnswers: 1,
        order: 1
      });
      
      const questionsData = await api.getQuestions(adminSelectedQuiz._id);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Failed to update question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (q: Question) => {
    setEditingQuestionId(q._id);
    setNewQuestion({
      questionText: q.questionText,
      codeSnippet: q.codeSnippet || '',
      programmingLanguage: q.programmingLanguage || 'javascript',
      options: q.options.map(o => ({ ...o })),
      numberOfCorrectAnswers: q.numberOfCorrectAnswers,
      order: q.order,
      image: q.image || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!adminSelectedQuiz) return;
    try {
      setIsLoading(true);
      await api.deleteQuestion(id);
      const questionsData = await api.getQuestions(adminSelectedQuiz._id);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Failed to delete question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (isSubmitted) return;
    const currentQuestion = questions[currentQuestionIndex];
    const questionId = currentQuestion._id;
    const currentAnswers = answers[questionId] || [];
    
    let newAnswers: number[];
    if (currentQuestion.numberOfCorrectAnswers > 1) {
      // Multiple choice
      if (currentAnswers.includes(optionIndex)) {
        newAnswers = currentAnswers.filter(idx => idx !== optionIndex);
      } else {
        newAnswers = [...currentAnswers, optionIndex];
      }
    } else {
      // Single choice
      newAnswers = [optionIndex];
    }
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: newAnswers
    }));
  };

  const resetQuiz = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsSubmitted(false);
    setSelectedCourse(null);
    setSelectedChapter(null);
    setSelectedQuiz(null);
    setView('home');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setLoginError('');
      
      let data;
      if (isRegistering) {
        data = await api.register(registerName, loginEmail, loginPassword);
      } else {
        data = await api.login(loginEmail, loginPassword);
      }
      
      const { user, token } = data;
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      setCurrentUser(user);
      setIsAdmin(user.role === 'admin');
      setView(user.role === 'admin' ? 'admin' : 'home');
      setLoginEmail('');
      setLoginPassword('');
      setRegisterName('');
    } catch (error: any) {
      setLoginError(error.response?.data?.message || error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAdmin(false);
    setView('home');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleChapter = (subjectName: string, title: string) => {
    const key = `${subjectName}-${title}`;
    setExpandedChapters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getLanguage = (subject: string | null) => {
    if (!subject) return 'javascript';
    const s = subject.toLowerCase();
    if (s.includes('java') && !s.includes('script')) return 'java';
    if (s.includes('js') || s.includes('react')) return 'javascript';
    if (s.includes('sql')) return 'sql';
    return 'javascript';
  };

  const calculateScore = () => {
    if (!quizResult) return 0;
    return quizResult.score;
  };

  const getAccuracy = () => {
    if (!quizResult) return 0;
    return quizResult.percentage;
  };

  const getResultGif = (accuracy: number) => {
    if (accuracy >= 80) return "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlHFRbmaZtBRhXG/giphy.gif"; // High score
    if (accuracy >= 50) return "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKVUn7iM8FMEU24/giphy.gif"; // Medium score
    return "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6ZzR6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/26ufcVAp3AiJJsrIs/giphy.gif"; // Low score
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-gray-200 font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#1a1a1a]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Trophy className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">ProQuiz Master</h1>
          </div>
          
          <nav className="flex items-center gap-2">
            <button 
              onClick={() => setView('home')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'home' || view === 'selection' || view === 'quiz' || view === 'results' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <PlayCircle size={18} />
              <span className="hidden sm:inline">Quiz</span>
            </button>
            {isAdmin ? (
              <>
                <button 
                  onClick={() => setView('admin')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'admin' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'}`}
                >
                  <Settings size={18} />
                  <span className="hidden sm:inline">Admin</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:bg-red-500/10 text-red-500"
                >
                  <XCircle size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button 
                onClick={() => setView('login')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${view === 'login' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400'}`}
              >
                <UserIcon size={18} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
            {view !== 'home' && (
              <button 
                onClick={resetQuiz}
                className="ml-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
              >
                <RotateCcw size={18} />
                <span className="hidden sm:inline">Reset Quiz</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-12"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block px-4 py-1.5 bg-orange-500/10 text-orange-500 text-sm font-bold rounded-full uppercase tracking-widest mb-4"
                >
                  Welcome to ProQuiz Master
                </motion.div>
                <h2 className="text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
                  Master Your Technical Skills with <span className="text-orange-500">Precision</span>
                </h2>
                <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
                  The ultimate platform for developers to test their knowledge across Java, JavaScript, React, Spring Boot, and MySQL.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <button
                  onClick={() => setView('selection')}
                  className="px-12 py-5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-orange-500/30 transition-all flex items-center gap-3 group"
                >
                  Start Learning Now
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12">
                {[
                  { label: 'Courses', value: courses.length },
                  { label: 'Chapters', value: Object.values(courseChapters).reduce((acc, c) => acc + c.length, 0) },
                  { label: 'Quizzes', value: Object.values(chapterQuizzes).reduce((acc, q) => acc + q.length, 0) },
                  { label: 'Questions', value: questions.length }
                ].map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-4 mb-4">
                  {selectedCourse && (
                    <button 
                      onClick={() => {
                        setSelectedCourse(null);
                        setSelectedChapter(null);
                        setSelectedQuiz(null);
                      }}
                      className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"
                    >
                      <ChevronLeft size={24} />
                    </button>
                  )}
                  <h2 className="text-4xl font-bold text-white">
                    {!selectedCourse ? 'Select Subject' : selectedCourse.title}
                  </h2>
                </div>
                <p className="text-gray-400">
                  {!selectedCourse 
                    ? 'Choose a subject to start your learning journey' 
                    : 'Select a chapter and quiz to test your knowledge'}
                </p>
              </div>

              <div className="max-w-5xl mx-auto">
                {!selectedCourse ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <button
                        key={course._id}
                        onClick={() => {
                          setSelectedCourse(course);
                          fetchChaptersForCourse(course._id);
                        }}
                        className="bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl hover:border-orange-500/30 transition-all group text-left relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                        <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
                          <Code size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 relative z-10">{course.title}</h3>
                        <p className="text-gray-500 text-sm relative z-10">{course.description}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courseChapters[selectedCourse._id]?.map((chapter) => (
                      <div key={chapter._id} className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden">
                        <button
                          onClick={() => toggleChapterExpansion(chapter._id)}
                          className="w-full px-8 py-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                              <Layers size={20} />
                            </div>
                            <div className="text-left">
                              <h3 className="text-xl font-bold text-white">{chapter.title}</h3>
                              <p className="text-gray-500 text-sm">{chapter.description}</p>
                            </div>
                          </div>
                          <div className={`transition-transform duration-300 ${expandedChapters[chapter._id] ? 'rotate-180' : ''}`}>
                            <ChevronDown size={20} className="text-gray-500" />
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {expandedChapters[chapter._id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-white/5"
                            >
                              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {chapterQuizzes[chapter._id]?.map((quiz) => (
                                  <button
                                    key={quiz._id}
                                    onClick={() => startQuiz(quiz._id)}
                                    className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-xl hover:border-orange-500/30 hover:bg-white/[0.08] transition-all group"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Trophy size={18} />
                                      </div>
                                      <div className="text-left">
                                        <h4 className="font-bold text-white">{quiz.title}</h4>
                                        <p className="text-xs text-gray-500">{quiz.timeLimit} mins • {quiz.passingScore}% to pass</p>
                                      </div>
                                    </div>
                                    <PlayCircle size={20} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                                  </button>
                                ))}
                                {(!chapterQuizzes[chapter._id] || chapterQuizzes[chapter._id].length === 0) && (
                                  <div className="col-span-full py-8 text-center text-gray-600 italic">
                                    No quizzes available for this chapter yet.
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                    {(!courseChapters[selectedCourse._id] || courseChapters[selectedCourse._id].length === 0) && (
                      <div className="py-20 text-center text-gray-500">
                        No chapters found for this subject.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'quiz' && questions.length > 0 && (
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            >
              {/* Left Side: Question Content */}
              <div className="lg:col-span-3 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-semibold text-white">Overview</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Total Questions</p>
                    <p className="text-2xl font-bold text-white">{questions.length}</p>
                  </div>
                  <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Attempted</p>
                    <p className="text-2xl font-bold text-orange-500">{Object.keys(answers).length}</p>
                  </div>
                  <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl relative overflow-hidden">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Time Remaining</p>
                    <p className={`text-2xl font-bold ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
                      {formatTime(timeLeft)}
                    </p>
                    <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
                      <motion.div 
                        className="h-full bg-orange-500"
                        initial={{ width: '100%' }}
                        animate={{ width: `${(timeLeft / quizDuration) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </div>
                  </div>
                  <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Status</p>
                    <p className="text-2xl font-bold text-emerald-500">Active</p>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-xs font-bold rounded-full uppercase tracking-widest">
                        {selectedCourse?.title}
                      </span>
                      <span className="text-gray-600">/</span>
                      <span className="text-gray-400 text-sm font-medium">
                        {selectedChapter?.title}
                      </span>
                      <span className="text-gray-600">/</span>
                      <span className="text-gray-400 text-sm font-medium">
                        {selectedQuiz?.title}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-white/5 text-gray-400 text-xs font-bold rounded-full uppercase tracking-widest">
                      Question {currentQuestionIndex + 1}
                    </span>
                  </div>

                  <h3 className="text-2xl font-medium text-white mb-8 leading-relaxed">
                    {questions[currentQuestionIndex].questionText}
                  </h3>

                  {questions[currentQuestionIndex].image && (
                    <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d]">
                      <img 
                        src={questions[currentQuestionIndex].image} 
                        alt="Question illustration" 
                        className="w-full h-auto max-h-[400px] object-contain mx-auto"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {questions[currentQuestionIndex].codeSnippet && (
                    <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d]">
                      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          <Code size={14} />
                          {selectedCourse?.title} Snippet
                        </div>
                      </div>
                      <div className="p-2">
                        <SyntaxHighlighter 
                          language={getLanguage(selectedCourse?.title || null)} 
                          style={atomDark}
                          customStyle={{ background: 'transparent', padding: '1rem', margin: 0, fontSize: '0.875rem' }}
                        >
                          {questions[currentQuestionIndex].codeSnippet}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {questions[currentQuestionIndex].options.map((option, idx) => {
                      const isSelected = answers[questions[currentQuestionIndex]._id]?.includes(idx);
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${
                            isSelected 
                              ? 'bg-orange-500/10 border-orange-500 text-white' 
                              : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                              isSelected ? 'bg-orange-500 text-white' : 'bg-white/10 text-gray-400 group-hover:bg-white/20'
                            }`}>
                              {String.fromCharCode(64 + idx)}
                            </div>
                            <span className="text-lg">{option.text}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="text-orange-500" size={20} />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
                    <button
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={20} />
                      Prev Question
                    </button>

                    {currentQuestionIndex === questions.length - 1 ? (
                      <button
                        onClick={() => {
                          setIsSubmitted(true);
                          setView('results');
                        }}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 transition-all"
                      >
                        Submit Quiz
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                      >
                        Next Question
                        <ChevronRight size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Palette */}
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Question palette</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-3">
                    {questions.map((q, idx) => {
                      const isAnswered = answers[q._id] && answers[q._id].length > 0;
                      const isCurrent = currentQuestionIndex === idx;
                      
                      return (
                        <button
                          key={q._id}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                            isCurrent 
                              ? 'bg-orange-500 text-white ring-4 ring-orange-500/20' 
                              : isAnswered 
                                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                                : 'bg-white/5 text-gray-500 border border-white/5 hover:border-white/20'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-orange-500/5 border border-orange-500/10 rounded-3xl p-6">
                  <p className="text-sm text-orange-500/80 leading-relaxed">
                    Tip: You can jump to any question using the palette. Answered questions are highlighted in green.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto text-center space-y-12 py-12"
            >
              <div className="space-y-4">
                <h2 className="text-5xl font-black text-white tracking-tight">Quiz Complete!</h2>
                <p className="text-gray-400 text-xl">Here's how you performed today.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl space-y-2">
                  <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">Accuracy</p>
                  <p className="text-5xl font-bold text-orange-500">{getAccuracy()}%</p>
                </div>
                <div className="bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl space-y-2">
                  <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">Score</p>
                  <p className="text-5xl font-bold text-emerald-500">{calculateScore()} / {questions.length}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl space-y-2">
                  <p className="text-gray-500 font-semibold uppercase tracking-widest text-xs">Time Taken</p>
                  <p className="text-5xl font-bold text-blue-500">{formatTime(quizDuration - timeLeft)}</p>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src={getResultGif(getAccuracy())} 
                  alt="Result Animation" 
                  className="w-full h-80 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="p-8 bg-gradient-to-t from-[#1a1a1a] to-transparent -mt-20 relative z-10">
                  <h3 className="text-3xl font-bold text-white mb-4">
                    {getAccuracy() >= 80 ? "Outstanding Performance!" : getAccuracy() >= 50 ? "Good Job!" : "Keep Practicing!"}
                  </h3>
                  <p className="text-gray-400 max-w-lg mx-auto mb-8">
                    {getAccuracy() >= 80 
                      ? "You've mastered these concepts. Your understanding of the subject is exceptional." 
                      : getAccuracy() >= 50 
                        ? "You have a solid foundation, but there's still room for improvement in some areas." 
                        : "Don't get discouraged! Review the material and try again to improve your score."}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={resetQuiz}
                      className="w-full sm:w-auto px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={20} />
                      Retake Quiz
                    </button>
                    <button 
                      onClick={() => setView('home')}
                      className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard size={20} />
                      Back to Home
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="min-h-[60vh] flex items-center justify-center"
            >
              <div className="bg-[#1a1a1a] border border-white/5 p-10 rounded-3xl w-full max-w-md shadow-2xl">
                <div className="text-center space-y-4 mb-10">
                  <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto">
                    {isRegistering ? <UserPlus className="text-orange-500" size={32} /> : <UserIcon className="text-orange-500" size={32} />}
                  </div>
                  <h2 className="text-3xl font-bold text-white">{isRegistering ? 'Create Account' : 'Login'}</h2>
                  <p className="text-gray-400">{isRegistering ? 'Join our community of learners today.' : 'Enter your credentials to access your account.'}</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  {loginError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                      <XCircle size={18} />
                      {loginError}
                    </div>
                  )}
                  
                  {isRegistering && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                      <input
                        type="text"
                        required
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-orange-500 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-orange-500 transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-orange-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Login')}
                  </button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setLoginError('');
                      }}
                      className="text-sm text-orange-500 hover:text-orange-400 font-medium transition-colors"
                    >
                      {isRegistering ? 'Already have an account? Login' : "Don't have an account? Create one"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setView('home')}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'admin' && isAdmin && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-4xl font-black text-white tracking-tight">
                    {adminView === 'hierarchy' ? 'Manage Hierarchy' : 'Manage Questions'}
                  </h2>
                  <p className="text-gray-400">
                    {adminView === 'hierarchy' 
                      ? 'Manage your courses, chapters, and quizzes.' 
                      : `Editing questions for ${adminSelectedQuiz?.title}`}
                  </p>
                </div>
                {adminView === 'questions' && (
                  <button 
                    onClick={() => setAdminView('hierarchy')}
                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <ChevronLeft size={18} />
                    Back to Hierarchy
                  </button>
                )}
              </div>

              {adminView === 'hierarchy' ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <div 
                        key={course._id} 
                        className={`bg-[#1a1a1a] border rounded-3xl transition-all relative overflow-hidden group ${adminSelectedCourse?._id === course._id ? 'border-orange-500/50 ring-4 ring-orange-500/10' : 'border-white/5 hover:border-white/10'}`}
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                        <div className="p-8 space-y-6 relative z-10">
                          <div className="flex items-center justify-between">
                            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Code size={24} />
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this course?')) {
                                    await api.deleteCourse(course._id);
                                    fetchInitialData();
                                  }
                                }}
                                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="text-2xl font-bold text-white">{course.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                          </div>

                          <button
                            onClick={() => {
                              setAdminSelectedCourse(course);
                              toggleCourseExpansion(course._id);
                            }}
                            className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${adminSelectedCourse?._id === course._id ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                          >
                            {adminSelectedCourse?._id === course._id ? 'Hide Chapters' : 'View Chapters'}
                            <ChevronDown size={16} className={`transition-transform ${expandedCourses[course._id] ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {showAddCourse ? (
                      <div className="bg-[#1a1a1a] border border-orange-500/30 rounded-3xl p-8 space-y-4">
                        <h4 className="text-xl font-bold text-white">Add New Course</h4>
                        <div className="space-y-4">
                          <input 
                            type="text" 
                            placeholder="Course Title"
                            value={newCourseData.title}
                            onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                          />
                          <textarea 
                            placeholder="Course Description"
                            value={newCourseData.description}
                            onChange={(e) => setNewCourseData({ ...newCourseData, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors h-24 resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={async () => {
                              if (newCourseData.title) {
                                await api.createCourse(newCourseData.title, newCourseData.description);
                                setShowAddCourse(false);
                                setNewCourseData({ title: '', description: '' });
                                fetchInitialData();
                              }
                            }}
                            className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all"
                          >
                            Create Course
                          </button>
                          <button 
                            onClick={() => setShowAddCourse(false)}
                            className="px-6 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddCourse(true)}
                        className="bg-white/[0.02] border-2 border-dashed border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all min-h-[250px] group"
                      >
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus size={24} />
                        </div>
                        <span className="font-bold">Add New Course</span>
                      </button>
                    )}
                  </div>

                  {adminSelectedCourse && expandedCourses[adminSelectedCourse._id] && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/5"></div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                          <Layers className="text-blue-500" size={20} />
                          Chapters in {adminSelectedCourse.title}
                        </h3>
                        <div className="h-px flex-1 bg-white/5"></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {courseChapters[adminSelectedCourse._id]?.map((chapter) => (
                          <div key={chapter._id} className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden group/chapter hover:border-blue-500/30 transition-all">
                            <div className="p-8 space-y-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center group-hover/chapter:scale-110 transition-transform">
                                    <Layers size={24} />
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-xl font-bold text-white">{chapter.title}</h4>
                                    <p className="text-xs text-gray-500">Chapter</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this chapter?')) {
                                      await api.deleteChapter(chapter._id);
                                      fetchChaptersForCourse(adminSelectedCourse._id);
                                    }
                                  }}
                                  className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                              
                              <button
                                onClick={() => {
                                  setAdminSelectedChapter(chapter);
                                  toggleChapterExpansion(chapter._id);
                                }}
                                className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${adminSelectedChapter?._id === chapter._id ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                              >
                                {adminSelectedChapter?._id === chapter._id ? 'Hide Quizzes' : 'View Quizzes'}
                                <ChevronDown size={16} className={`transition-transform ${expandedChapters[chapter._id] ? 'rotate-180' : ''}`} />
                              </button>

                              <AnimatePresence>
                                {expandedChapters[chapter._id] && adminSelectedChapter?._id === chapter._id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden space-y-3 pt-4"
                                  >
                                    {chapterQuizzes[chapter._id]?.map((quiz) => (
                                        <div 
                                          key={quiz._id} 
                                          onClick={() => {
                                            setAdminSelectedQuiz(quiz);
                                            setAdminView('questions');
                                            api.getQuestions(quiz._id).then(setQuestions);
                                          }}
                                          className="flex items-center gap-2 p-3 bg-white/5 border border-white/5 rounded-xl group/quiz cursor-pointer hover:border-orange-500/30 hover:bg-white/[0.08] transition-all"
                                        >
                                          <div className="w-8 h-8 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center">
                                            <Trophy size={14} />
                                          </div>
                                          <div className="flex-1">
                                            <p className="w-full bg-transparent border-none text-sm text-gray-300 focus:text-white focus:outline-none focus:ring-0 p-0">
                                              {quiz.title}
                                            </p>
                                            <p className="text-[10px] text-gray-500">{quiz.timeLimit} mins • {quiz.passingScore}% to pass</p>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover/quiz:opacity-100 transition-opacity">
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to delete this quiz?')) {
                                                  api.deleteQuiz(quiz._id).then(() => fetchQuizzesForChapter(chapter._id));
                                                }
                                              }}
                                              className="p-2 bg-white/5 text-gray-500 hover:text-red-500 rounded-lg transition-all"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        </div>
                                    ))}
                                    {showAddQuiz ? (
                                      <div className="bg-white/5 border border-orange-500/30 rounded-xl p-4 space-y-3 mt-3">
                                        <h4 className="text-xs font-bold text-white uppercase tracking-widest">Add New Quiz</h4>
                                        <div className="space-y-3">
                                          <input 
                                            type="text" 
                                            placeholder="Quiz Title"
                                            value={newQuizData.title}
                                            onChange={(e) => setNewQuizData({ ...newQuizData, title: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-xs"
                                          />
                                          <textarea 
                                            placeholder="Quiz Description"
                                            value={newQuizData.description}
                                            onChange={(e) => setNewQuizData({ ...newQuizData, description: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-xs h-16 resize-none"
                                          />
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                              <label className="text-[10px] text-gray-500 uppercase">Time (mins)</label>
                                              <input 
                                                type="number" 
                                                value={newQuizData.timeLimit}
                                                onChange={(e) => setNewQuizData({ ...newQuizData, timeLimit: parseInt(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-xs"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[10px] text-gray-500 uppercase">Pass %</label>
                                              <input 
                                                type="number" 
                                                value={newQuizData.passingScore}
                                                onChange={(e) => setNewQuizData({ ...newQuizData, passingScore: parseInt(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors text-xs"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <button 
                                            onClick={async () => {
                                              if (newQuizData.title && adminSelectedCourse) {
                                                await api.createQuiz(chapter._id, adminSelectedCourse._id, newQuizData.title, newQuizData.description, newQuizData.passingScore, newQuizData.timeLimit);
                                                setShowAddQuiz(false);
                                                setNewQuizData({ title: '', description: '', passingScore: 70, timeLimit: 15 });
                                                fetchQuizzesForChapter(chapter._id);
                                              }
                                            }}
                                            className="flex-1 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-all text-[10px] uppercase tracking-wider"
                                          >
                                            Create
                                          </button>
                                          <button 
                                            onClick={() => setShowAddQuiz(false)}
                                            className="px-3 py-2 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-[10px] uppercase tracking-wider"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setShowAddQuiz(true)}
                                        className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                      >
                                        <Plus size={14} />
                                        Add New Quiz
                                      </button>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        ))}
                        
                        {showAddChapter ? (
                          <div className="bg-[#1a1a1a] border border-blue-500/30 rounded-2xl p-6 space-y-4">
                            <h4 className="text-lg font-bold text-white">Add New Chapter</h4>
                            <div className="space-y-4">
                              <input 
                                type="text" 
                                placeholder="Chapter Title"
                                value={newChapterData.title}
                                onChange={(e) => setNewChapterData({ ...newChapterData, title: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                              />
                              <textarea 
                                placeholder="Chapter Description"
                                value={newChapterData.description}
                                onChange={(e) => setNewChapterData({ ...newChapterData, description: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors h-20 resize-none text-sm"
                              />
                            </div>
                            <div className="flex gap-3">
                              <button 
                                onClick={async () => {
                                  if (newChapterData.title && adminSelectedCourse) {
                                    await api.createChapter(adminSelectedCourse._id, newChapterData.title, newChapterData.description);
                                    setShowAddChapter(false);
                                    setNewChapterData({ title: '', description: '' });
                                    fetchChaptersForCourse(adminSelectedCourse._id);
                                  }
                                }}
                                className="flex-1 py-2.5 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all text-sm"
                              >
                                Create Chapter
                              </button>
                              <button 
                                onClick={() => setShowAddChapter(false)}
                                className="px-4 py-2.5 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowAddChapter(true)}
                            className="bg-white/[0.02] border-2 border-dashed border-white/5 rounded-2xl p-6 flex items-center justify-center gap-3 text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all min-h-[100px] group"
                          >
                            <Plus size={20} />
                            <span className="font-bold">Add New Chapter</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-10 space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-white">
                        {editingQuestionId ? 'Edit Question' : 'Add New Question'}
                      </h3>
                      {adminSelectedQuiz && (
                        <div className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl text-sm font-bold">
                          Quiz: {adminSelectedQuiz.title}
                        </div>
                      )}
                    </div>

                    {!adminSelectedQuiz ? (
                      <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                        <AlertCircle className="mx-auto text-gray-600 mb-4" size={48} />
                        <p className="text-gray-400">Please select a quiz from the Hierarchy tab first.</p>
                        <button 
                          onClick={() => setAdminView('hierarchy')}
                          className="mt-6 px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
                        >
                          Go to Hierarchy
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleAddQuestion} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Question Text</label>
                            <textarea
                              required
                              value={newQuestion.questionText}
                              onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:border-orange-500 transition-all min-h-[150px]"
                              placeholder="Enter your question here..."
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Code Snippet (Optional)</label>
                            <div className="border border-white/10 rounded-2xl overflow-hidden h-[150px]">
                              <Editor
                                height="100%"
                                defaultLanguage="javascript"
                                theme="vs-dark"
                                value={newQuestion.codeSnippet}
                                onChange={(value) => setNewQuestion({ ...newQuestion, codeSnippet: value })}
                                options={{
                                  minimap: { enabled: false },
                                  fontSize: 14,
                                  lineNumbers: 'on',
                                  scrollBeyondLastLine: false,
                                }}
                              />
                            </div>
                            <div className="flex gap-4">
                              <select
                                value={newQuestion.programmingLanguage}
                                onChange={(e) => setNewQuestion({ ...newQuestion, programmingLanguage: e.target.value })}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-orange-500"
                              >
                                <option value="javascript">JavaScript</option>
                                <option value="typescript">TypeScript</option>
                                <option value="java">Java</option>
                                <option value="python">Python</option>
                                <option value="sql">SQL</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {newQuestion.options?.map((option, idx) => (
                            <div key={idx} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Option {idx + 1}</label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={option.isCorrect}
                                    onChange={(e) => {
                                      const updatedOptions = [...(newQuestion.options || [])];
                                      updatedOptions[idx].isCorrect = e.target.checked;
                                      setNewQuestion({ 
                                        ...newQuestion, 
                                        options: updatedOptions,
                                        numberOfCorrectAnswers: updatedOptions.filter(o => o.isCorrect).length
                                      });
                                    }}
                                    className="hidden"
                                  />
                                  <div className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center ${option.isCorrect ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 group-hover:border-white/40'}`}>
                                    {option.isCorrect && <CheckCircle2 size={14} className="text-white" />}
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase tracking-widest ${option.isCorrect ? 'text-emerald-500' : 'text-gray-500'}`}>
                                    Correct Answer
                                  </span>
                                </label>
                              </div>
                              <input
                                type="text"
                                required
                                value={option.text}
                                onChange={(e) => {
                                  const updatedOptions = [...(newQuestion.options || [])];
                                  updatedOptions[idx].text = e.target.value;
                                  setNewQuestion({ ...newQuestion, options: updatedOptions });
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-orange-500 transition-all"
                                placeholder={`Enter option ${idx + 1}...`}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                          <button
                            type="submit"
                            className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                          >
                            {editingQuestionId ? <Save size={20} /> : <PlusCircle size={20} />}
                            {editingQuestionId ? 'Update Question' : 'Add Question'}
                          </button>
                          {editingQuestionId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestionId(null);
                                setNewQuestion({
                                  questionText: '',
                                  codeSnippet: '',
                                  programmingLanguage: 'javascript',
                                  options: [
                                    { text: '', isCorrect: true },
                                    { text: '', isCorrect: false },
                                    { text: '', isCorrect: false },
                                    { text: '', isCorrect: false }
                                  ],
                                  numberOfCorrectAnswers: 1,
                                  order: 1
                                });
                              }}
                              className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                            >
                              Cancel Edit
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                  </div>

                  {adminSelectedQuiz && questions.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-white">Existing Questions ({questions.length})</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {questions.map((q, idx) => (
                          <div key={q._id} className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-white/10 transition-all">
                            <div className="flex items-center gap-6">
                              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-500 font-bold">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="text-white font-medium line-clamp-1 max-w-xl">{q.questionText}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{q.options.length} Options</span>
                                  <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                    {q.numberOfCorrectAnswers} Correct
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditClick(q)}
                                className="p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteQuestion(q._id)}
                                className="p-3 bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">© 2026 ProQuiz Master. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
