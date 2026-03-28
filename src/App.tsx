import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
  Layers
} from 'lucide-react';

interface Question {
  id: number;
  subject: string;
  chapter: string;
  topic: string;
  question: string;
  code?: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: number;
  image?: string;
}

interface Chapter {
  name: string;
  topics: string[];
}

interface Subject {
  name: string;
  chapters: Chapter[];
}

type View = 'home' | 'selection' | 'quiz' | 'admin' | 'results' | 'login';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<{name: string, questionCount: number}[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [adminSelectedSubject, setAdminSelectedSubject] = useState<string | null>(null);
  const [adminSelectedChapter, setAdminSelectedChapter] = useState<string | null>(null);
  const [adminSelectedTopic, setAdminSelectedTopic] = useState<string | null>(null);
  const [adminAvailableChapters, setAdminAvailableChapters] = useState<string[]>([]);
  const [adminAvailableTopics, setAdminAvailableTopics] = useState<{name: string, questionCount: number}[]>([]);

  const fetchAdminChapters = async (subject: string) => {
    try {
      const res = await fetch(`/api/chapters?subject=${encodeURIComponent(subject)}`);
      const data = await res.json();
      setAdminAvailableChapters(data);
      setAdminSelectedChapter(null);
      setAdminSelectedTopic(null);
      setAdminAvailableTopics([]);
    } catch (error) {
      console.error('Failed to fetch admin chapters:', error);
    }
  };

  const fetchAdminTopics = async (subject: string, chapter: string) => {
    try {
      const res = await fetch(`/api/topics?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`);
      const data = await res.json();
      setAdminAvailableTopics(data);
      setAdminSelectedTopic(null);
    } catch (error) {
      console.error('Failed to fetch admin topics:', error);
    }
  };
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizDuration, setQuizDuration] = useState(0);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

  // Admin form state
  const [newQuestion, setNewQuestion] = useState({
    subject: '',
    chapter: '',
    topic: '',
    question: '',
    code: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_option: 1,
    image: ''
  });

  useEffect(() => {
    fetchHierarchy();
    fetchAvailableSubjects();
  }, []);

  useEffect(() => {
    if (view === 'home') {
      fetchQuestions();
    }
  }, [view]);

  useEffect(() => {
    if (adminSelectedSubject && adminSelectedChapter && adminSelectedTopic) {
      setNewQuestion(prev => ({
        ...prev,
        subject: adminSelectedSubject,
        chapter: adminSelectedChapter,
        topic: adminSelectedTopic
      }));
    }
  }, [adminSelectedSubject, adminSelectedChapter, adminSelectedTopic]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === 'quiz' && timeLeft > 0 && !isSubmitted) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (view === 'quiz' && timeLeft === 0 && !isSubmitted) {
      setIsSubmitted(true);
      setView('results');
    }
    return () => clearInterval(timer);
  }, [view, timeLeft, isSubmitted]);

  const fetchHierarchy = async () => {
    try {
      const res = await fetch('/api/hierarchy');
      const data = await res.json();
      setSubjects(data);
    } catch (error) {
      console.error('Failed to fetch hierarchy:', error);
    }
  };

  const fetchAvailableSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      setAvailableSubjects(data);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchChapters = async (subject: string) => {
    try {
      const res = await fetch(`/api/chapters?subject=${encodeURIComponent(subject)}`);
      const data = await res.json();
      setAvailableChapters(data);
      setSelectedChapter(null);
      setSelectedTopic(null);
      setAvailableTopics([]);
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    }
  };

  const fetchTopics = async (subject: string, chapter: string) => {
    try {
      const res = await fetch(`/api/topics?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`);
      const data = await res.json();
      setAvailableTopics(data);
      setSelectedTopic(null);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    }
  };

  const fetchQuestions = async (subject?: string, chapter?: string, topic?: string) => {
    try {
      let url = '/api/questions';
      const params = new URLSearchParams();
      if (subject) params.append('subject', subject);
      if (chapter) params.append('chapter', chapter);
      if (topic) params.append('topic', topic);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = async (subject: string, chapter: string, topic: string) => {
    setSelectedSubject(subject);
    setSelectedChapter(chapter);
    setSelectedTopic(topic);
    
    // Fetch questions first to know the count for timing
    try {
      let url = `/api/questions?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}&topic=${encodeURIComponent(topic)}`;
      const res = await fetch(url);
      const data = await res.json();
      setQuestions(data);
      
      // Set time: 60 seconds per question
      const duration = data.length * 60;
      setTimeLeft(duration);
      setQuizDuration(duration);
      
      setCurrentQuestionIndex(0);
      setAnswers({});
      setIsSubmitted(false);
      setView('quiz');
    } catch (error) {
      console.error('Failed to start quiz:', error);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuestionId) {
      handleUpdateQuestion(e);
      return;
    }
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      });
      if (res.ok) {
        setNewQuestion({
          subject: adminSelectedSubject || '',
          chapter: adminSelectedChapter || '',
          topic: adminSelectedTopic || '',
          question: '',
          code: '',
          option1: '',
          option2: '',
          option3: '',
          option4: '',
          correct_option: 1,
          image: ''
        });
        fetchHierarchy();
        fetchAvailableSubjects();
        if (adminSelectedTopic) {
          fetchQuestions(adminSelectedSubject!, adminSelectedChapter!, adminSelectedTopic);
          fetchAdminTopics(adminSelectedSubject!, adminSelectedChapter!);
        } else {
          fetchQuestions();
        }
      }
    } catch (error) {
      console.error('Failed to add question:', error);
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestionId) return;
    try {
      const res = await fetch(`/api/questions/${editingQuestionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      });
      if (res.ok) {
        setEditingQuestionId(null);
        setNewQuestion({
          subject: adminSelectedSubject || '',
          chapter: adminSelectedChapter || '',
          topic: adminSelectedTopic || '',
          question: '',
          code: '',
          option1: '',
          option2: '',
          option3: '',
          option4: '',
          correct_option: 1,
          image: ''
        });
        fetchHierarchy();
        fetchAvailableSubjects();
        if (adminSelectedTopic) {
          fetchQuestions(adminSelectedSubject!, adminSelectedChapter!, adminSelectedTopic);
          fetchAdminTopics(adminSelectedSubject!, adminSelectedChapter!);
        } else {
          fetchQuestions();
        }
      }
    } catch (error) {
      console.error('Failed to update question:', error);
    }
  };

  const handleEditClick = (q: Question) => {
    setEditingQuestionId(q.id);
    setNewQuestion({
      subject: q.subject,
      chapter: q.chapter,
      topic: q.topic,
      question: q.question,
      code: q.code || '',
      option1: q.option1,
      option2: q.option2,
      option3: q.option3,
      option4: q.option4,
      correct_option: q.correct_option,
      image: q.image || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renameSubject = async (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    try {
      await fetch('/api/subjects/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName })
      });
      if (adminSelectedSubject === oldName) setAdminSelectedSubject(newName);
      fetchHierarchy();
      fetchAvailableSubjects();
      if (adminSelectedTopic) {
        fetchQuestions(adminSelectedSubject === oldName ? newName : adminSelectedSubject!, adminSelectedChapter!, adminSelectedTopic);
      } else {
        fetchQuestions();
      }
    } catch (error) {
      console.error('Failed to rename subject:', error);
    }
  };

  const renameChapter = async (subject: string, oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    try {
      await fetch('/api/chapters/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, oldName, newName })
      });
      if (adminSelectedChapter === oldName) setAdminSelectedChapter(newName);
      fetchHierarchy();
      fetchAvailableSubjects();
      if (adminSelectedTopic) {
        fetchQuestions(adminSelectedSubject!, adminSelectedChapter === oldName ? newName : adminSelectedChapter!, adminSelectedTopic);
      } else {
        fetchQuestions();
      }
    } catch (error) {
      console.error('Failed to rename chapter:', error);
    }
  };

  const renameTopic = async (subject: string, chapter: string, oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    try {
      await fetch('/api/topics/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, chapter, oldName, newName })
      });
      if (adminSelectedTopic === oldName) setAdminSelectedTopic(newName);
      fetchHierarchy();
      fetchAvailableSubjects();
      if (adminSelectedTopic === oldName || adminSelectedTopic) {
        fetchQuestions(adminSelectedSubject!, adminSelectedChapter!, adminSelectedTopic === oldName ? newName : adminSelectedTopic!);
      } else {
        fetchQuestions();
      }
    } catch (error) {
      console.error('Failed to rename topic:', error);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      await fetch('/api/questions/' + id, { method: 'DELETE' });
      if (adminSelectedTopic) {
        fetchQuestions(adminSelectedSubject!, adminSelectedChapter!, adminSelectedTopic);
        fetchAdminTopics(adminSelectedSubject!, adminSelectedChapter!);
      } else {
        fetchQuestions();
      }
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (isSubmitted) return;
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestionIndex].id]: optionIndex
    }));
  };

  const resetQuiz = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsSubmitted(false);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setView('home');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail === 'admin@gmail.com' && loginPassword === 'admin@123') {
      setIsAdmin(true);
      setView('admin');
      setLoginError('');
      setLoginEmail('');
      setLoginPassword('');
    } else {
      setLoginError('Invalid credentials. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setView('home');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleChapter = (subjectName: string, chapterName: string) => {
    const key = `${subjectName}-${chapterName}`;
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
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_option) {
        score++;
      }
    });
    return score;
  };

  const getAccuracy = () => {
    if (questions.length === 0) return 0;
    return Math.round((calculateScore() / questions.length) * 100);
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
                <Settings size={18} />
                <span className="hidden sm:inline">Admin Login</span>
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
                  { label: 'Active Quizzes', value: questions.length },
                  { label: 'Subjects', value: subjects.length },
                  { label: 'Chapters', value: subjects.reduce((acc, s) => acc + s.chapters.length, 0) },
                  { label: 'Topics', value: subjects.reduce((acc, s) => acc + s.chapters.reduce((a, c) => a + c.topics.length, 0), 0) }
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
                  {selectedSubject && (
                    <button 
                      onClick={() => {
                        setSelectedSubject(null);
                        setSelectedChapter(null);
                        setSelectedTopic(null);
                      }}
                      className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"
                    >
                      <RotateCcw size={20} />
                    </button>
                  )}
                  <h2 className="text-4xl font-bold text-white">
                    {!selectedSubject ? 'Select Subject' : !selectedChapter ? 'Select Chapter' : 'Select Topic'}
                  </h2>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className={`px-3 py-1 rounded-full ${!selectedSubject ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-500'}`}>1. Subject</span>
                  <ChevronRight size={14} className="text-gray-700" />
                  <span className={`px-3 py-1 rounded-full ${selectedSubject && !selectedChapter ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-500'}`}>2. Chapter</span>
                  <ChevronRight size={14} className="text-gray-700" />
                  <span className={`px-3 py-1 rounded-full ${selectedChapter ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-500'}`}>3. Topic</span>
                </div>
              </div>

              <div className="max-w-5xl mx-auto">
                {!selectedSubject ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableSubjects.map((subjectName) => (
                      <button
                        key={subjectName}
                        onClick={() => {
                          setSelectedSubject(subjectName);
                          fetchChapters(subjectName);
                        }}
                        className="bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl hover:border-orange-500/30 transition-all group text-left"
                      >
                        <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <Code size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{subjectName}</h3>
                        <p className="text-gray-500 text-sm">Explore chapters and topics in {subjectName}</p>
                      </button>
                    ))}
                  </div>
                ) : !selectedChapter ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableChapters.map((chapterName) => (
                      <button
                        key={chapterName}
                        onClick={() => {
                          setSelectedChapter(chapterName);
                          fetchTopics(selectedSubject, chapterName);
                        }}
                        className="bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl hover:border-orange-500/30 transition-all group text-left"
                      >
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <Settings size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{chapterName}</h3>
                        <p className="text-gray-500 text-sm">View available topics</p>
                      </button>
                    ))}
                    {availableChapters.length === 0 && (
                      <div className="col-span-full py-20 text-center text-gray-500">
                        No chapters found for this subject.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableTopics.map((topic) => (
                      <button
                        key={topic.name}
                        onClick={() => startQuiz(selectedSubject, selectedChapter, topic.name)}
                        className="bg-[#1a1a1a] border border-white/5 p-8 rounded-3xl hover:border-orange-500/30 transition-all group text-left"
                      >
                        <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <Trophy size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{topic.name}</h3>
                        <p className="text-gray-500 text-sm">{topic.questionCount} Questions available</p>
                      </button>
                    ))}
                    {availableTopics.length === 0 && (
                      <div className="col-span-full py-20 text-center text-gray-500">
                        No topics found for this chapter.
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
                        {selectedSubject}
                      </span>
                      <span className="text-gray-600">/</span>
                      <span className="text-gray-400 text-sm font-medium">
                        {selectedChapter}
                      </span>
                      <span className="text-gray-600">/</span>
                      <span className="text-gray-400 text-sm font-medium">
                        {selectedTopic}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-white/5 text-gray-400 text-xs font-bold rounded-full uppercase tracking-widest">
                      Question {currentQuestionIndex + 1}
                    </span>
                  </div>

                  <h3 className="text-2xl font-medium text-white mb-8 leading-relaxed">
                    {questions[currentQuestionIndex].question}
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

                  {questions[currentQuestionIndex].code && (
                    <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d]">
                      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          <Code size={14} />
                          {selectedSubject} Snippet
                        </div>
                      </div>
                      <div className="p-2">
                        <SyntaxHighlighter 
                          language={getLanguage(selectedSubject)} 
                          style={atomDark}
                          customStyle={{ background: 'transparent', padding: '1rem', margin: 0, fontSize: '0.875rem' }}
                        >
                          {questions[currentQuestionIndex].code}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((idx) => {
                      const optionKey = `option${idx}` as keyof Question;
                      const isSelected = answers[questions[currentQuestionIndex].id] === idx;
                      
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
                            <span className="text-lg">{questions[currentQuestionIndex][optionKey] as string}</span>
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
                      const isAnswered = answers[q.id] !== undefined;
                      const isCurrent = currentQuestionIndex === idx;
                      
                      return (
                        <button
                          key={q.id}
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
                      onClick={() => setView('admin')}
                      className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard size={20} />
                      Manage Questions
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
                    <Settings className="text-orange-500" size={32} />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Admin Login</h2>
                  <p className="text-gray-400">Enter your credentials to access the dashboard.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  {loginError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                      <XCircle size={18} />
                      {loginError}
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
                      placeholder="admin@gmail.com"
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
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition-all"
                  >
                    Login to Dashboard
                  </button>
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
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-black text-white tracking-tight">Hierarchy Management</h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">Organize your curriculum by managing subjects, chapters, and topics.</p>
              </div>

              <div className="grid grid-cols-1 gap-12">
                {subjects.map(subject => (
                  <div key={subject.name} className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-10 space-y-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-3xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                          <Code size={32} />
                        </div>
                        <div className="flex-1 max-w-xl">
                          <label className="text-[10px] font-black text-orange-500/50 uppercase tracking-[0.3em] mb-2 block">Subject Identity</label>
                          <input 
                            type="text" 
                            defaultValue={subject.name}
                            onBlur={(e) => renameSubject(subject.name, e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-2xl font-bold text-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
                            placeholder="Enter Subject Name"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 relative z-10">
                      {subject.chapters.map(chapter => (
                        <div key={chapter.name} className="bg-white/[0.03] rounded-[2rem] p-8 border border-white/5 space-y-8 hover:bg-white/[0.05] transition-colors group/chapter">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                                <Settings size={16} />
                              </div>
                              <label className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.3em] block">Chapter</label>
                            </div>
                            <input 
                              type="text" 
                              defaultValue={chapter.name}
                              onBlur={(e) => renameChapter(subject.name, chapter.name, e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:border-blue-500 transition-all outline-none"
                              placeholder="Enter Chapter Name"
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Topics</label>
                              <span className="text-[10px] font-bold text-gray-600 bg-white/5 px-2 py-1 rounded-md">{chapter.topics.length} Total</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              {chapter.topics.map(topic => (
                                <div key={topic} className="group/topic relative">
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-green-500/30 group-hover/topic:bg-green-500 transition-colors"></div>
                                  <input 
                                    type="text" 
                                    defaultValue={topic}
                                    onBlur={(e) => renameTopic(subject.name, chapter.name, topic, e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl pl-8 pr-4 py-2.5 text-sm text-gray-300 focus:text-white focus:border-green-500 transition-all outline-none"
                                  />
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const newTopicName = prompt('Enter new topic name:');
                                  if (newTopicName) {
                                    setNewQuestion({
                                      ...newQuestion,
                                      subject: subject.name,
                                      chapter: chapter.name,
                                      topic: newTopicName,
                                      question: `Placeholder question for ${newTopicName}`,
                                      option1: 'Option 1',
                                      option2: 'Option 2',
                                      option3: 'Option 3',
                                      option4: 'Option 4',
                                      correct_option: 1
                                    });
                                    alert('Topic creation initiated.');
                                  }
                                }}
                                className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                              >
                                <Plus size={14} />
                                Add New Topic
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        onClick={() => {
                          const newChapterName = prompt('Enter new chapter name:');
                          if (newChapterName) {
                            setNewQuestion({
                              ...newQuestion,
                              subject: subject.name,
                              chapter: newChapterName,
                              topic: 'General',
                              question: `Placeholder question for ${newChapterName}`,
                              option1: 'Option 1',
                              option2: 'Option 2',
                              option3: 'Option 3',
                              option4: 'Option 4',
                              correct_option: 1
                            });
                            alert('Chapter creation initiated.');
                          }
                        }}
                        className="bg-white/[0.02] rounded-[2rem] p-8 border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-6 text-gray-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all min-h-[300px] group/add"
                      >
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center group-hover/add:scale-110 transition-transform duration-500">
                          <Plus size={32} />
                        </div>
                        <div className="text-center">
                          <span className="block text-xl font-bold mb-1">Add New Chapter</span>
                          <span className="text-xs text-gray-600 uppercase tracking-widest">Expand {subject.name}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center pt-12">
                <button
                  onClick={() => {
                    const newSubjectName = prompt('Enter new subject name:');
                    if (newSubjectName) {
                      setNewQuestion({
                        ...newQuestion,
                        subject: newSubjectName,
                        chapter: 'General',
                        topic: 'General',
                        question: `Placeholder question for ${newSubjectName}`,
                        code: '',
                        option1: 'Option 1',
                        option2: 'Option 2',
                        option3: 'Option 3',
                        option4: 'Option 4',
                        correct_option: 1,
                        image: ''
                      });
                      alert('Subject creation initiated.');
                    }
                  }}
                  className="px-16 py-8 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-[2.5rem] shadow-[0_20px_50px_rgba(249,115,22,0.3)] hover:shadow-[0_20px_60px_rgba(249,115,22,0.4)] transition-all flex items-center gap-6 group"
                >
                  <div className="w-14 h-14 bg-white/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <Plus size={32} />
                  </div>
                  <div className="text-left">
                    <span className="block text-2xl uppercase tracking-tighter">Create New Subject</span>
                    <span className="text-xs text-white/60 font-bold uppercase tracking-[0.2em]">Add to Curriculum</span>
                  </div>
                </button>
              </div>
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
