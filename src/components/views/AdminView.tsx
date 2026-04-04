import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '@monaco-editor/react';
import { 
  ChevronLeft, Plus, Search, Code, Trash2, Layers, ChevronDown, Trophy, 
  AlertCircle, CheckCircle2, Save, PlusCircle, Edit, Users, Clock, Medal,
  RefreshCw, Filter, BookOpen
} from 'lucide-react';
import * as api from '../../services/api';
import { Course, Chapter, Quiz, Question, GlobalLeaderboardEntry } from '../../types';

interface AdminViewProps {
  adminView: 'hierarchy' | 'questions' | 'leaderboard';
  setAdminView: (val: 'hierarchy' | 'questions' | 'leaderboard') => void;
  courses: Course[];
  courseChapters: Record<string, Chapter[]>;
  chapterQuizzes: Record<string, Quiz[]>;
  adminSelectedCourse: Course | null;
  setAdminSelectedCourse: (val: Course | null) => void;
  adminSelectedChapter: Chapter | null;
  setAdminSelectedChapter: (val: Chapter | null) => void;
  adminSelectedQuiz: Quiz | null;
  setAdminSelectedQuiz: (val: Quiz | null) => void;
  expandedCourses: Record<string, boolean>;
  toggleCourseExpansion: (id: string) => void;
  expandedChapters: Record<string, boolean>;
  toggleChapterExpansion: (id: string) => void;
  courseSearch: string;
  setCourseSearch: (val: string) => void;
  showAddCourse: boolean;
  setShowAddCourse: (val: boolean) => void;
  newCourseData: { title: string; description: string };
  setNewCourseData: (val: { title: string; description: string }) => void;
  fetchInitialData: () => void;
  showAddChapter: boolean;
  setShowAddChapter: (val: boolean) => void;
  newChapterData: { title: string; description: string };
  setNewChapterData: (val: { title: string; description: string }) => void;
  fetchChaptersForCourse: (id: string) => void;
  showAddQuiz: boolean;
  setShowAddQuiz: (val: boolean) => void;
  newQuizData: {
    title: string;
    description: string;
    questionCount: number;
    passingScore: number;
    timeLimit: number;
  };
  setNewQuizData: (val: {
    title: string;
    description: string;
    questionCount: number;
    passingScore: number;
    timeLimit: number;
  }) => void;
  fetchQuizzesForChapter: (id: string) => void;
  quizQuestionCounts: Record<string, number>;
  questions: Question[];
  setQuestions: (val: Question[]) => void;
  editingQuestionId: string | null;
  setEditingQuestionId: (val: string | null) => void;
  newQuestion: Partial<Question>;
  setNewQuestion: (val: Partial<Question>) => void;
  handleAddQuestion: (e: React.FormEvent) => void;
  handleEditClick: (q: Question) => void;
  handleDeleteQuestion: (id: string) => void;
  publishQuiz: (quizId: string, chapterId: string) => void;
  pushToast: (text: string, type?: 'success' | 'error' | 'loading', durationMs?: number) => number;
  updateToast: (id: number, text: string, type?: 'success' | 'error' | 'loading', durationMs?: number) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  adminView, setAdminView, courses, courseChapters, chapterQuizzes,
  adminSelectedCourse, setAdminSelectedCourse,
  adminSelectedChapter, setAdminSelectedChapter,
  adminSelectedQuiz, setAdminSelectedQuiz,
  expandedCourses, toggleCourseExpansion,
  expandedChapters, toggleChapterExpansion,
  courseSearch, setCourseSearch,
  showAddCourse, setShowAddCourse, newCourseData, setNewCourseData, fetchInitialData,
  showAddChapter, setShowAddChapter, newChapterData, setNewChapterData, fetchChaptersForCourse,
  showAddQuiz, setShowAddQuiz, newQuizData, setNewQuizData, fetchQuizzesForChapter,
  quizQuestionCounts,
  questions, setQuestions,
  editingQuestionId, setEditingQuestionId,
  newQuestion, setNewQuestion,
  handleAddQuestion, handleEditClick, handleDeleteQuestion,
  publishQuiz,
  pushToast,
  updateToast
}) => {
  const [formError, setFormError] = useState<string>('');
  const [editingQuizData, setEditingQuizData] = useState<{
    quizId: string;
    chapterId: string;
    title: string;
    description: string;
    questionCount: number;
    passingScore: number;
    timeLimit: number;
  } | null>(null);

  // Leaderboard state
  const [lbEntries, setLbEntries] = useState<GlobalLeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbSearch, setLbSearch] = useState('');
  const [lbQuizFilter, setLbQuizFilter] = useState('');
  const [lbDateFrom, setLbDateFrom] = useState('');
  const [lbDateTo, setLbDateTo] = useState('');
  const [lbSort, setLbSort] = useState<'merit' | 'date'>('merit');
  const [lbPage, setLbPage] = useState(1);
  const LB_PAGE_SIZE = 10;

  const [chapterSearch, setChapterSearch] = useState('');
  const [quizSearch, setQuizSearch] = useState('');

  const [editingChapterData, setEditingChapterData] = useState<{
    chapterId: string;
    title: string;
    description: string;
  } | null>(null);

  const loadLeaderboard = async () => {
    setLbLoading(true);
    try {
      const data = await api.getAllLeaderboard();
      setLbEntries(data);
    } catch {
      // silent
    } finally {
      setLbLoading(false);
    }
  };

  useEffect(() => {
    if (adminView === 'leaderboard') {
      loadLeaderboard();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminView]);

  // Reset to page 1 whenever any filter or sort changes
  useEffect(() => { setLbPage(1); }, [lbSearch, lbQuizFilter, lbDateFrom, lbDateTo, lbSort]);

  const closeEditQuizModal = () => {
    setEditingQuizData(null);
    setFormError('');
  };

  const [editingCourseData, setEditingCourseData] = useState<{
    courseId: string;
    title: string;
    description: string;
  } | null>(null);

  return (
    <motion.div 
      key="admin"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-12"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-white tracking-tight">
            {adminView === 'hierarchy' ? 'Manage Hierarchy' : adminView === 'leaderboard' ? 'Leaderboard' : 'Manage Questions'}
          </h2>
          <p className="text-gray-400">
            {adminView === 'hierarchy' 
              ? 'Manage your courses, chapters, and quizzes.'
              : adminView === 'leaderboard'
              ? 'View all student quiz submissions and rankings.'
              : `Editing questions for ${adminSelectedQuiz?.title}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {adminView === 'questions' && (
            <button 
              onClick={() => setAdminView('hierarchy')}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}
          <div className="flex items-center bg-white/5 border border-white/5 rounded-xl p-1 gap-1">
            <button
              onClick={() => setAdminView('hierarchy')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                adminView === 'hierarchy' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Layers size={14} />
              Hierarchy
            </button>
            <button
              onClick={() => setAdminView('leaderboard')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                adminView === 'leaderboard' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Trophy size={14} />
              Leaderboard
            </button>
          </div>
        </div>
      </div>

      {adminView === 'hierarchy' ? (
        <div className="space-y-8">
          <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Courses</h3>
            </div>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search courses..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses
                .filter(c => c.title.toLowerCase().includes(courseSearch.toLowerCase()))
                .map((course) => (
                  <div
                    key={course._id}
                    onClick={() => {
                      setAdminSelectedCourse(course);
                      setAdminSelectedChapter(null);
                      setAdminSelectedQuiz(null);
                      fetchChaptersForCourse(course._id);
                    }}
                    className={`relative p-5 rounded-2xl border transition-all group cursor-pointer ${
                      adminSelectedCourse?._id === course._id
                        ? 'bg-orange-500/10 border-orange-500/50'
                        : 'bg-white/5 border-white/5 hover:border-white/15'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setAdminSelectedCourse(course);
                        setAdminSelectedChapter(null);
                        setAdminSelectedQuiz(null);
                        fetchChaptersForCourse(course._id);
                      }
                    }}
                  >
                    {/* Live / Draft badge */}
                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      course.isPublished ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
                    }`}>
                      {course.isPublished ? 'Live' : 'Draft'}
                    </span>

                    <div className="flex items-start gap-3 min-w-0 pr-14">
                      <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
                        adminSelectedCourse?._id === course._id
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/10 text-gray-500'
                      }`}>
                        <Code size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{course.title}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">{course.description || 'No description yet'}</p>
                      </div>
                    </div>

                    {/* Hover actions row */}
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {/* Live toggle */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const toastId = pushToast(course.isPublished ? 'Taking offline...' : 'Publishing...', 'loading', 0);
                          try {
                            const updated = await api.updateCourse(course._id, { isPublished: !course.isPublished });
                            updateToast(toastId, updated.isPublished ? 'Course is now Live' : 'Course set to Draft', 'success', 2500);
                            fetchInitialData();
                            if (adminSelectedCourse?._id === course._id) setAdminSelectedCourse(updated);
                          } catch (err: any) {
                            updateToast(toastId, err.response?.data?.message || 'Failed', 'error', 3000);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          course.isPublished
                            ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400'
                            : 'bg-yellow-500/10 text-yellow-400 hover:bg-green-500/10 hover:text-green-400'
                        }`}
                        title={course.isPublished ? 'Take offline' : 'Publish course'}
                      >
                        <CheckCircle2 size={12} />
                        {course.isPublished ? 'Unpublish' : 'Publish'}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCourseData({ courseId: course._id, title: course.title, description: course.description });
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                        title="Edit course"
                      >
                        <Edit size={12} />
                        Edit
                      </button>

                      {/* Delete */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Delete this course and all its data?')) {
                            await api.deleteCourse(course._id);
                            if (adminSelectedCourse?._id === course._id) setAdminSelectedCourse(null);
                            fetchInitialData();
                          }
                        }}
                        className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

              {/* Dotted "create course" card */}
              {!courseSearch && (
                <button
                  onClick={() => setShowAddCourse(true)}
                  className="p-5 rounded-2xl border-2 border-dashed border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all flex flex-col items-center justify-center gap-3 text-gray-600 hover:text-orange-400 min-h-[110px] group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/5 group-hover:bg-orange-500/10 flex items-center justify-center transition-all">
                    <Plus size={18} />
                  </div>
                  <span className="text-xs font-bold">New Course</span>
                </button>
              )}
            </div>

            {courses.filter(c => c.title.toLowerCase().includes(courseSearch.toLowerCase())).length === 0 && courseSearch && (
              <div className="text-center py-6 text-gray-600 text-sm italic">
                No courses found.
              </div>
            )}
          </div>

          <div className="space-y-6">
            {adminSelectedCourse ? (
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] pointer-events-none rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-500/10 transition-all duration-700" />
                  <div className="relative flex items-center gap-6">
                    <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 ring-1 ring-orange-500/20">
                      <BookOpen size={32} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white tracking-tight">{adminSelectedCourse.title}</h3>
                      <p className="text-gray-500 text-sm font-medium">{adminSelectedCourse.description}</p>
                    </div>
                  </div>
                  <div className="relative flex items-center gap-3">
                    <button
                      onClick={() => setEditingCourseData({ courseId: adminSelectedCourse._id, title: adminSelectedCourse.title, description: adminSelectedCourse.description })}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-white/5"
                    >
                      <Edit size={16} />
                      Edit Course
                    </button>
                    <button
                      onClick={async () => {
                        const newStatus = !adminSelectedCourse.isPublished;
                        const toastId = pushToast(newStatus ? 'Publishing course...' : 'Unpublishing...', 'loading', 0);
                        try {
                          await api.updateCourse(adminSelectedCourse._id, { isPublished: newStatus });
                          updateToast(toastId, `Course ${newStatus ? 'published' : 'unpublished'}`, 'success', 2500);
                          fetchInitialData();
                        } catch (err: any) {
                          updateToast(toastId, 'Failed to update status', 'error', 3000);
                        }
                      }}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${
                        adminSelectedCourse.isPublished
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                          : 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      <CheckCircle2 size={16} />
              {adminSelectedCourse.isPublished ? 'Published' : 'Publish Course'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Panel: Chapters (40%) */}
                  <div className="lg:col-span-5 bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 flex flex-col h-[600px]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest">Chapters</h4>
                    </div>

                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                      <input
                        type="text"
                        placeholder="Search chapters..."
                        value={chapterSearch}
                        onChange={(e) => setChapterSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar mb-4">
                      {(courseChapters[adminSelectedCourse._id] || [])
                        .filter(ch => ch.title.toLowerCase().includes(chapterSearch.toLowerCase()))
                        .map((chapter) => (
                        <div
                          key={chapter._id}
                          onClick={() => {
                            setAdminSelectedChapter(chapter);
                            setAdminSelectedQuiz(null);
                            fetchQuizzesForChapter(chapter._id);
                          }}
                          className={`relative p-4 rounded-xl border cursor-pointer transition-all group ${
                            adminSelectedChapter?._id === chapter._id
                              ? 'bg-blue-500/10 border-blue-500/40'
                              : 'bg-white/5 border-white/5 hover:border-white/15 shadow-lg'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 pr-8">
                            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                              adminSelectedChapter?._id === chapter._id
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/10 text-gray-500'
                            }`}>
                              <Layers size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-white truncate">{chapter.title}</p>
                              <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{chapter.description || 'No description'}</p>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2.5 border-t border-white/5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChapterData({ chapterId: chapter._id, title: chapter.title, description: chapter.description });
                                setFormError('');
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                            >
                              <Edit size={10} />
                              Edit
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this chapter?')) {
                                  await api.deleteChapter(chapter._id);
                                  if (adminSelectedChapter?._id === chapter._id) {
                                    setAdminSelectedChapter(null);
                                    setAdminSelectedQuiz(null);
                                  }
                                  fetchChaptersForCourse(adminSelectedCourse._id);
                                }
                              }}
                              className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all"
                            >
                              <Trash2 size={10} />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setShowAddChapter(true)}
                      className="w-full p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-blue-400 group flex-shrink-0"
                    >
                      <Plus size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">New Chapter</span>
                    </button>
                  </div>

                  {/* Right Panel: Quizzes (60%) */}
                  <div className="lg:col-span-7 bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 flex flex-col h-[600px]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-orange-400 uppercase tracking-widest">
                        {adminSelectedChapter ? `Quizzes: ${adminSelectedChapter.title}` : 'Quizzes'}
                      </h4>
                    </div>

                    {!adminSelectedChapter ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-600 mb-4">
                          <Trophy size={24} />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Select a chapter from the left to view or create quizzes.</p>
                      </div>
                    ) : (
                      <>
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                          <input
                            type="text"
                            placeholder="Search quizzes..."
                            value={quizSearch}
                            onChange={(e) => setQuizSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-all"
                          />
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar mb-4">
                          {(chapterQuizzes[adminSelectedChapter._id] || [])
                            .filter(qz => qz.title.toLowerCase().includes(quizSearch.toLowerCase()))
                            .map((quiz) => (
                            <div
                              key={quiz._id}
                              onClick={() => {
                                setAdminSelectedQuiz(quiz);
                                setAdminView('questions');
                                api.getQuestions(quiz._id).then(setQuestions);
                              }}
                              className={`relative p-4 rounded-xl border cursor-pointer transition-all group ${
                                adminSelectedQuiz?._id === quiz._id
                                  ? 'bg-amber-500/10 border-amber-500/40'
                                  : 'bg-white/5 border-white/5 hover:border-white/15 shadow-lg'
                              }`}
                            >
                              <span className={`absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                quiz.isPublished ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
                              }`}>
                                {quiz.isPublished ? 'Live' : 'Draft'}
                              </span>

                              <div className="flex items-start gap-3 min-w-0 pr-12">
                                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                                  adminSelectedQuiz?._id === quiz._id
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-white/10 text-gray-500'
                                }`}>
                                  <Trophy size={14} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-white truncate">{quiz.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5 whitespace-nowrap overflow-hidden">
                                    <span className="text-[10px] text-gray-500">{quiz.timeLimit}m</span>
                                    <span className="text-[10px] text-gray-600">•</span>
                                    <span className="text-[10px] text-gray-500">{quiz.passingScore}% pass</span>
                                    <span className="text-[10px] text-gray-600">•</span>
                                    <span className={`text-[10px] ${quizQuestionCounts[quiz._id] === quiz.questionCount ? 'text-gray-500' : 'text-red-400 font-bold'}`}>
                                      {quizQuestionCounts[quiz._id] || 0}/{quiz.questionCount} Qs
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingQuizData({
                                      quizId: quiz._id,
                                      chapterId: adminSelectedChapter._id,
                                      title: quiz.title,
                                      description: quiz.description || '',
                                      questionCount: quiz.questionCount || quizQuestionCounts[quiz._id] || 1,
                                      passingScore: quiz.passingScore,
                                      timeLimit: quiz.timeLimit,
                                    });
                                    setFormError('');
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 text-gray-400 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                                >
                                  <Edit size={10} />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    publishQuiz(quiz._id, adminSelectedChapter._id);
                                  }}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                                    quiz.isPublished
                                      ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400'
                                      : 'bg-yellow-500/10 text-yellow-400 hover:bg-green-500/10 hover:text-green-400'
                                  }`}
                                >
                                  <CheckCircle2 size={10} />
                                  {quiz.isPublished ? 'Unpublish' : 'Publish'}
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this quiz?')) {
                                      await api.deleteQuiz(quiz._id);
                                      fetchQuizzesForChapter(adminSelectedChapter._id);
                                    }
                                  }}
                                  className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/5 text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all"
                                >
                                  <Trash2 size={10} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => setShowAddQuiz(true)}
                          className="p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-orange-400 group flex-shrink-0"
                        >
                          <Plus size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">New Quiz</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {formError && <p className="text-red-400 text-xs font-medium">{formError}</p>}
              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 space-y-6">
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-gray-600">
                  <Layers size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">No Course Selected</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">Select a course card above to manage its chapters and quizzes.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : adminView === 'leaderboard' ? (
        <div className="space-y-6">
          {/* Stats bar */}
          {lbEntries.length > 0 && (() => {
            const total = lbEntries.length;
            const passed = lbEntries.filter(e => e.isPassed).length;
            const avgPct = Math.round(lbEntries.reduce((s, e) => s + e.percentage, 0) / total);
            return (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Attempts', value: total, icon: <Users size={18} />, color: 'text-blue-400' },
                  { label: 'Avg Score', value: `${avgPct}%`, icon: <Medal size={18} />, color: 'text-amber-400' },
                  { label: 'Pass Rate', value: `${Math.round((passed / total) * 100)}%`, icon: <CheckCircle2 size={18} />, color: 'text-green-400' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>{icon}</div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{label}</p>
                      <p className="text-2xl font-black text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Filters + refresh */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
              <input
                type="text"
                placeholder="Search by student name..."
                value={lbSearch}
                onChange={(e) => setLbSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={15} />
              <select
                value={lbQuizFilter}
                onChange={(e) => setLbQuizFilter(e.target.value)}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
              >
                <option value="">All Quizzes</option>
                {[...new Map(lbEntries.map(e => [e.quizTitle, e.quizTitle])).values()].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <input
              type="date"
              value={lbDateFrom}
              onChange={(e) => setLbDateFrom(e.target.value)}
              title="From date"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]"
            />
            <input
              type="date"
              value={lbDateTo}
              onChange={(e) => setLbDateTo(e.target.value)}
              title="To date"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark]"
            />
            <button
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setLbDateFrom(today);
                setLbDateTo(today);
              }}
              className="px-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
            >
              Today
            </button>
            {(lbSearch || lbQuizFilter || lbDateFrom || lbDateTo) && (
              <button
                onClick={() => { setLbSearch(''); setLbQuizFilter(''); setLbDateFrom(''); setLbDateTo(''); }}
                className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Clear
              </button>
            )}
            <button
              onClick={loadLeaderboard}
              disabled={lbLoading}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={lbLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Sort mode */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Sort by:</span>
            <div className="flex items-center bg-white/5 border border-white/5 rounded-xl p-1 gap-1">
              <button
                onClick={() => setLbSort('merit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  lbSort === 'merit' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Medal size={12} />
                Merit (Score → Earliest Submit)
              </button>
              <button
                onClick={() => setLbSort('date')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  lbSort === 'date' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Clock size={12} />
                Latest Submitted
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden">
            {lbLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-500 gap-3">
                <RefreshCw size={20} className="animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (() => {
              const filtered = lbEntries.filter(e => {
                const matchSearch = e.userName.toLowerCase().includes(lbSearch.toLowerCase()) ||
                  e.userEmail.toLowerCase().includes(lbSearch.toLowerCase());
                const matchQuiz = !lbQuizFilter || e.quizTitle === lbQuizFilter;
                const entryDate = new Date(e.createdAt);
                const matchFrom = !lbDateFrom || entryDate >= new Date(lbDateFrom);
                const matchTo = !lbDateTo || entryDate <= new Date(lbDateTo + 'T23:59:59');
                return matchSearch && matchQuiz && matchFrom && matchTo;
              }).slice().sort((a, b) => {
                if (lbSort === 'merit') {
                  // Primary: score desc; tiebreaker: earliest submission (timestamp asc)
                  if (b.percentage !== a.percentage) return b.percentage - a.percentage;
                  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                }
                // 'date': newest first
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              });

              if (filtered.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-gray-600">
                      <Trophy size={28} />
                    </div>
                    <p className="text-gray-500 text-sm">
                      {lbEntries.length === 0 ? 'No quiz submissions yet.' : 'No results match the current filters.'}
                    </p>
                  </div>
                );
              }

              const totalPages = Math.max(1, Math.ceil(filtered.length / LB_PAGE_SIZE));
              const safePage = Math.min(lbPage, totalPages);
              const paginated = filtered.slice((safePage - 1) * LB_PAGE_SIZE, safePage * LB_PAGE_SIZE);

              return (
                <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['#', 'Student', 'Quiz', 'Score', '% Score', 'Status', 'Time', 'Date'].map(h => (
                          <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((entry, idx) => {
                        const globalIdx = (safePage - 1) * LB_PAGE_SIZE + idx;
                        const mins = Math.floor(entry.timeTaken / 60);
                        const secs = entry.timeTaken % 60;
                        const timeStr = mins > 0
                          ? `${mins}m ${secs}s`
                          : `${secs}s`;
                        const d = new Date(entry.createdAt);
                        const date = d.toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        });
                        const time = d.toLocaleTimeString('en-US', {
                          hour: '2-digit', minute: '2-digit', second: '2-digit',
                        });
                        return (
                          <tr key={idx} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                            <td className="px-5 py-4">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                                globalIdx === 0 ? 'bg-amber-500/20 text-amber-400' :
                                globalIdx === 1 ? 'bg-gray-400/10 text-gray-300' :
                                globalIdx === 2 ? 'bg-orange-700/20 text-orange-500' :
                                'bg-white/5 text-gray-500'
                              }`}>{globalIdx + 1}</span>
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-bold text-white">{entry.userName}</p>
                              <p className="text-[11px] text-gray-500">{entry.userEmail}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-gray-300 font-medium max-w-[180px] truncate">{entry.quizTitle}</p>
                            </td>
                            <td className="px-5 py-4 text-gray-300 font-bold">{entry.score}/{entry.totalQuestions}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${entry.percentage >= 70 ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ width: `${entry.percentage}%` }}
                                  />
                                </div>
                                <span className="text-gray-300 font-bold">{entry.percentage}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                entry.isPassed
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}>
                                {entry.isPassed ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <Clock size={12} />
                                <span>{timeStr}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-gray-400 text-xs font-medium">{date}</p>
                              <p className="text-gray-600 text-[11px]">{time}</p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination bar */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
                    <p className="text-xs text-gray-500">
                      Showing {(safePage - 1) * LB_PAGE_SIZE + 1}–{Math.min(safePage * LB_PAGE_SIZE, filtered.length)} of {filtered.length} results
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setLbPage(1)}
                        disabled={safePage === 1}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >«</button>
                      <button
                        onClick={() => setLbPage(p => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >‹</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                        .reduce<(number | '…')[]>((acc, p, i, arr) => {
                          if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, i) =>
                          item === '…' ? (
                            <span key={`ellipsis-${i}`} className="px-2 text-gray-600 text-xs">…</span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => setLbPage(item as number)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                safePage === item
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'text-gray-500 hover:text-white hover:bg-white/5'
                              }`}
                            >{item}</button>
                          )
                        )}
                      <button
                        onClick={() => setLbPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >›</button>
                      <button
                        onClick={() => setLbPage(totalPages)}
                        disabled={safePage === totalPages}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >»</button>
                    </div>
                  </div>
                )}
                </>
              );
            })()}
          </div>
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
                    <div className="border border-white/10 rounded-2xl overflow-hidden h-[250px]">
                      <Editor
                        height="100%"
                        language={newQuestion.programmingLanguage}
                        theme="vs-dark"
                        value={newQuestion.codeSnippet}
                        onChange={(value) => setNewQuestion({ ...newQuestion, codeSnippet: value })}
                        onMount={(editor, monaco) => {
                          monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                            noSemanticValidation: true,
                            noSyntaxValidation: true,
                          });
                          monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                            noSemanticValidation: true,
                            noSyntaxValidation: true,
                          });
                        }}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          padding: { top: 10, bottom: 10 },
                          wordWrap: 'on'
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

      <AnimatePresence>
        {showAddCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setShowAddCourse(false); setFormError(''); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-xl bg-[#1a1a1a] border border-orange-500/30 rounded-3xl p-7 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">New Course</h4>
                <button
                  onClick={() => { setShowAddCourse(false); setFormError(''); }}
                  className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Course title"
                  value={newCourseData.title}
                  onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
                <textarea
                  placeholder="Course description"
                  value={newCourseData.description}
                  onChange={(e) => setNewCourseData({ ...newCourseData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors h-28 resize-none"
                />
              </div>

              {formError && (
                <p className="text-red-400 text-xs font-medium">{formError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!newCourseData.title.trim()) {
                      setFormError('Course title is required');
                      return;
                    }

                    setFormError('');
                    const toastId = pushToast('Creating course...', 'loading', 0);
                    try {
                      await api.createCourse(newCourseData.title.trim(), newCourseData.description.trim());
                      updateToast(toastId, 'Course created successfully', 'success', 2600);
                      setShowAddCourse(false);
                      setNewCourseData({ title: '', description: '' });
                      fetchInitialData();
                    } catch (err: any) {
                      const message = err.response?.data?.message || err.message || 'Failed to create course';
                      setFormError(message);
                      updateToast(toastId, message, 'error', 3400);
                    }
                  }}
                  className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-sm"
                >
                  Create Course
                </button>
                <button
                  onClick={() => { setShowAddCourse(false); setFormError(''); }}
                  className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {editingCourseData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setEditingCourseData(null);
              setFormError('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-xl bg-[#1a1a1a] border border-blue-500/30 rounded-3xl p-7 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Edit Course</h4>
                <button
                  onClick={() => {
                    setEditingCourseData(null);
                    setFormError('');
                  }}
                  className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Course title"
                  value={editingCourseData.title}
                  onChange={(e) =>
                    setEditingCourseData({ ...editingCourseData, title: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <textarea
                  placeholder="Course description"
                  value={editingCourseData.description}
                  onChange={(e) =>
                    setEditingCourseData({
                      ...editingCourseData,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors h-28 resize-none"
                />
              </div>

              {formError && <p className="text-red-400 text-xs font-medium">{formError}</p>}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!editingCourseData.title.trim()) {
                      setFormError('Course title is required');
                      return;
                    }

                    setFormError('');
                    const toastId = pushToast('Updating course...', 'loading', 0);
                    try {
                      const updated = await api.updateCourse(editingCourseData.courseId, {
                        title: editingCourseData.title.trim(),
                        description: editingCourseData.description.trim(),
                      });

                      updateToast(toastId, 'Course updated', 'success', 2500);
                      if (adminSelectedCourse?._id === updated._id) {
                        setAdminSelectedCourse(updated);
                      }
                      setEditingCourseData(null);
                      fetchInitialData();
                    } catch (err: any) {
                      const message =
                        err.response?.data?.message || err.message || 'Failed to update course';
                      setFormError(message);
                      updateToast(toastId, message, 'error', 3400);
                    }
                  }}
                  className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all text-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingCourseData(null);
                    setFormError('');
                  }}
                  className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {editingQuizData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeEditQuizModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-xl bg-[#1a1a1a] border border-blue-500/30 rounded-3xl p-7 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Edit Quiz Details</h4>
                <button
                  onClick={closeEditQuizModal}
                  className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Quiz Title</label>
                  <input
                    type="text"
                    value={editingQuizData.title}
                    onChange={(e) =>
                      setEditingQuizData({ ...editingQuizData, title: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Description</label>
                  <textarea
                    value={editingQuizData.description}
                    onChange={(e) =>
                      setEditingQuizData({ ...editingQuizData, description: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">No. of Questions</label>
                  <input
                    type="number"
                    min={1}
                    value={editingQuizData.questionCount}
                    onChange={(e) =>
                      setEditingQuizData({
                        ...editingQuizData,
                        questionCount: parseInt(e.target.value || '1', 10),
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Duration (mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={editingQuizData.timeLimit}
                    onChange={(e) =>
                      setEditingQuizData({
                        ...editingQuizData,
                        timeLimit: parseInt(e.target.value || '1', 10),
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Passing %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingQuizData.passingScore}
                    onChange={(e) =>
                      setEditingQuizData({
                        ...editingQuizData,
                        passingScore: parseInt(e.target.value || '0', 10),
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {formError && <p className="text-red-400 text-xs font-medium">{formError}</p>}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!editingQuizData.title.trim()) {
                      setFormError('Quiz title is required');
                      return;
                    }

                    setFormError('');
                    const toastId = pushToast('Updating quiz details...', 'loading', 0);
                    try {
                      await api.updateQuiz(editingQuizData.quizId, {
                        title: editingQuizData.title.trim(),
                        description: editingQuizData.description.trim(),
                        questionCount: editingQuizData.questionCount,
                        passingScore: editingQuizData.passingScore,
                        timeLimit: editingQuizData.timeLimit,
                      });

                      await fetchQuizzesForChapter(editingQuizData.chapterId);
                      updateToast(toastId, 'Quiz details updated', 'success', 2600);
                      closeEditQuizModal();
                    } catch (err: any) {
                      const message =
                        err.response?.data?.message || err.message || 'Failed to update quiz details';
                      setFormError(message);
                      updateToast(toastId, message, 'error', 4200);
                    }
                  }}
                  className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all text-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={closeEditQuizModal}
                  className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showAddChapter && adminSelectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddChapter(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-xl bg-[#1a1a1a] border border-blue-500/30 rounded-3xl p-7 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">New Chapter</h4>
                <button
                  onClick={() => setShowAddChapter(false)}
                  className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Chapter title"
                  value={newChapterData.title}
                  onChange={(e) => setNewChapterData({ ...newChapterData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                <textarea
                  placeholder="Chapter description"
                  value={newChapterData.description}
                  onChange={(e) => setNewChapterData({ ...newChapterData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors h-28 resize-none"
                />
              </div>

              {formError && (
                <p className="text-red-400 text-xs font-medium">{formError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!newChapterData.title.trim()) {
                      setFormError('Chapter title is required');
                      return;
                    }

                    setFormError('');
                    const toastId = pushToast('Adding chapter...', 'loading', 0);
                    try {
                      await api.createChapter(adminSelectedCourse._id, newChapterData.title.trim(), newChapterData.description.trim());
                      updateToast(toastId, 'Chapter added successfully', 'success', 2600);
                      setShowAddChapter(false);
                      setNewChapterData({ title: '', description: '' });
                      fetchChaptersForCourse(adminSelectedCourse._id);
                    } catch (err: any) {
                      const message = err.response?.data?.message || err.message || 'Failed to add chapter';
                      setFormError(message);
                      updateToast(toastId, message, 'error', 3400);
                    }
                  }}
                  className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all text-sm"
                >
                  Create Chapter
                </button>
                <button
                  onClick={() => setShowAddChapter(false)}
                  className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAddQuiz && adminSelectedChapter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddQuiz(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="w-full max-w-xl bg-[#1a1a1a] border border-orange-500/30 rounded-3xl p-7 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">New Quiz</h4>
                <button
                  onClick={() => setShowAddQuiz(false)}
                  className="px-3 py-1.5 bg-white/5 text-gray-400 font-bold rounded-lg hover:bg-white/10 transition-all text-xs"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Quiz Title</label>
                  <input
                    type="text"
                    placeholder="E.g. Advanced Java Streams"
                    value={newQuizData.title}
                    onChange={(e) => setNewQuizData({ ...newQuizData, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Description</label>
                  <textarea
                    placeholder="Short description of the quiz..."
                    value={newQuizData.description}
                    onChange={(e) => setNewQuizData({ ...newQuizData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-all h-24 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Questions</label>
                  <input
                    type="number"
                    min={1}
                    value={newQuizData.questionCount}
                    onChange={(e) => setNewQuizData({ ...newQuizData, questionCount: parseInt(e.target.value || '1', 10) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Time (mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={newQuizData.timeLimit}
                    onChange={(e) => setNewQuizData({ ...newQuizData, timeLimit: parseInt(e.target.value || '1', 10) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-red-400 text-xs font-medium">{formError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!newQuizData.title.trim()) {
                      setFormError('Quiz title is required');
                      return;
                    }

                    setFormError('');
                    const toastId = pushToast('Creating quiz...', 'loading', 0);
                    try {
                      await api.createQuiz(
                        adminSelectedChapter._id,
                        adminSelectedCourse._id,
                        newQuizData.title.trim(),
                        newQuizData.description.trim(),
                        newQuizData.questionCount,
                        newQuizData.passingScore,
                        newQuizData.timeLimit
                      );
                      updateToast(toastId, 'Quiz created successfully', 'success', 2600);
                      setShowAddQuiz(false);
                      setNewQuizData({
                        title: '',
                        description: '',
                        questionCount: 1,
                        passingScore: 70,
                        timeLimit: 15,
                      });
                      fetchQuizzesForChapter(adminSelectedChapter._id);
                    } catch (err: any) {
                      const message = err.response?.data?.message || err.message || 'Failed to create quiz';
                      setFormError(message);
                      updateToast(toastId, message, 'error', 3400);
                    }
                  }}
                  className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all text-sm"
                >
                  Create Quiz
                </button>
                <button
                  onClick={() => setShowAddQuiz(false)}
                  className="px-5 py-3 bg-white/5 text-gray-400 font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
