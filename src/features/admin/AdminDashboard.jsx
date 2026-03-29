import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronDown, 
  Trophy, 
  Layers, 
  Code, 
  Edit, 
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import * as adminApi from '../admin.api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import QuestionForm from './QuestionForm';
import QuestionList from './QuestionList';

const AdminDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [courseChapters, setCourseChapters] = useState({});
  const [chapterQuizzes, setChapterQuizzes] = useState({});
  const [questions, setQuestions] = useState([]);
  
  const [adminSelectedCourse, setAdminSelectedCourse] = useState(null);
  const [adminSelectedChapter, setAdminSelectedChapter] = useState(null);
  const [adminSelectedQuiz, setAdminSelectedQuiz] = useState(null);
  const [adminView, setAdminView] = useState('hierarchy');
  
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseData, setNewCourseData] = useState({ title: '', description: '' });
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterData, setNewChapterData] = useState({ title: '', description: '' });
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [newQuizData, setNewQuizData] = useState({ title: '', description: '', passingScore: 70, timeLimit: 15 });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getCourses();
      setCourses(data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChapters = async (courseId) => {
    try {
      const data = await adminApi.getChapters(courseId);
      setCourseChapters(prev => ({ ...prev, [courseId]: data }));
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    }
  };

  const fetchQuizzes = async (chapterId) => {
    try {
      const data = await adminApi.getQuizzes(chapterId);
      setChapterQuizzes(prev => ({ ...prev, [chapterId]: data }));
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    }
  };

  const toggleCourse = async (courseId) => {
    const isExpanding = !expandedCourses[courseId];
    setExpandedCourses(prev => ({ ...prev, [courseId]: isExpanding }));
    if (isExpanding && !courseChapters[courseId]) {
      await fetchChapters(courseId);
    }
  };

  const toggleChapter = async (chapterId) => {
    const isExpanding = !expandedChapters[chapterId];
    setExpandedChapters(prev => ({ ...prev, [chapterId]: isExpanding }));
    if (isExpanding && !chapterQuizzes[chapterId]) {
      await fetchQuizzes(chapterId);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourseData.title) return;
    try {
      await adminApi.createCourse(newCourseData.title, newCourseData.description);
      setShowAddCourse(false);
      setNewCourseData({ title: '', description: '' });
      fetchCourses();
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await adminApi.deleteCourse(id);
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const handleCreateChapter = async () => {
    if (!newChapterData.title || !adminSelectedCourse) return;
    try {
      await adminApi.createChapter(adminSelectedCourse._id, newChapterData.title, newChapterData.description);
      setShowAddChapter(false);
      setNewChapterData({ title: '', description: '' });
      fetchChapters(adminSelectedCourse._id);
    } catch (error) {
      console.error('Failed to create chapter:', error);
    }
  };

  const handleDeleteChapter = async (id) => {
    if (!window.confirm('Are you sure you want to delete this chapter?')) return;
    try {
      await adminApi.deleteChapter(id);
      fetchChapters(adminSelectedCourse._id);
    } catch (error) {
      console.error('Failed to delete chapter:', error);
    }
  };

  const handleCreateQuiz = async (chapterId) => {
    if (!newQuizData.title || !adminSelectedCourse) return;
    try {
      await adminApi.createQuiz(
        chapterId, 
        adminSelectedCourse._id, 
        newQuizData.title, 
        newQuizData.description, 
        newQuizData.passingScore, 
        newQuizData.timeLimit
      );
      setShowAddQuiz(false);
      setNewQuizData({ title: '', description: '', passingScore: 70, timeLimit: 15 });
      fetchQuizzes(chapterId);
    } catch (error) {
      console.error('Failed to create quiz:', error);
    }
  };

  const handleDeleteQuiz = async (quizId, chapterId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await adminApi.deleteQuiz(quizId);
      fetchQuizzes(chapterId);
    } catch (error) {
      console.error('Failed to delete quiz:', error);
    }
  };

  const handleManageQuestions = async (quiz) => {
    setAdminSelectedQuiz(quiz);
    setAdminView('questions');
    try {
      const data = await adminApi.getQuestions(quiz._id);
      setQuestions(data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            {adminView === 'hierarchy' ? 'Admin Dashboard' : 'Question Management'}
          </h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
            {adminView === 'hierarchy' 
              ? 'Manage your courses, chapters, and quizzes.' 
              : `Editing questions for ${adminSelectedQuiz?.title}`}
          </p>
        </div>
        {adminView === 'questions' && (
          <Button 
            variant="secondary" 
            onClick={() => setAdminView('hierarchy')}
            icon={ChevronLeft}
          >
            Back to Hierarchy
          </Button>
        )}
      </div>

      {adminView === 'hierarchy' ? (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-250px)] min-h-[600px]">
          {/* Column 1: Courses */}
          <div className="flex-1 flex flex-col bg-[#111] border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-bottom border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Code size={18} className="text-orange-500" />
                Courses
              </h3>
              <button 
                onClick={() => setShowAddCourse(true)}
                className="p-2 bg-orange-500/10 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {showAddCourse && (
                <div className="p-4 bg-white/5 border border-orange-500/30 rounded-2xl space-y-4">
                  <Input 
                    placeholder="Course Title"
                    value={newCourseData.title}
                    onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                    className="text-sm"
                  />
                  <textarea 
                    placeholder="Description"
                    value={newCourseData.description}
                    onChange={(e) => setNewCourseData({ ...newCourseData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm h-20 resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleCreateCourse} className="flex-1 py-2 text-xs">Create</Button>
                    <Button variant="secondary" onClick={() => setShowAddCourse(false)} className="py-2 text-xs">Cancel</Button>
                  </div>
                </div>
              )}

              {courses.map((course) => (
                <div 
                  key={course._id}
                  onClick={() => {
                    setAdminSelectedCourse(course);
                    setAdminSelectedChapter(null);
                    if (!courseChapters[course._id]) fetchChapters(course._id);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${adminSelectedCourse?._id === course._id ? 'bg-orange-500/10 border-orange-500/50' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-bold transition-colors ${adminSelectedCourse?._id === course._id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                      {course.title}
                    </h4>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course._id);
                      }}
                      className="p-1.5 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{course.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Chapters */}
          <div className="flex-1 flex flex-col bg-[#111] border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-bottom border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-blue-500" />
                Chapters
              </h3>
              {adminSelectedCourse && (
                <button 
                  onClick={() => setShowAddChapter(true)}
                  className="p-2 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {!adminSelectedCourse ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 p-8 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                    <ChevronLeft size={32} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest">Select a course to view chapters</p>
                </div>
              ) : (
                <>
                  {showAddChapter && (
                    <div className="p-4 bg-white/5 border border-blue-500/30 rounded-2xl space-y-4">
                      <Input 
                        placeholder="Chapter Title"
                        value={newChapterData.title}
                        onChange={(e) => setNewChapterData({ ...newChapterData, title: e.target.value })}
                        className="text-sm"
                      />
                      <textarea 
                        placeholder="Description"
                        value={newChapterData.description}
                        onChange={(e) => setNewChapterData({ ...newChapterData, description: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm h-20 resize-none"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleCreateChapter} className="flex-1 py-2 text-xs">Create</Button>
                        <Button variant="secondary" onClick={() => setShowAddChapter(false)} className="py-2 text-xs">Cancel</Button>
                      </div>
                    </div>
                  )}

                  {courseChapters[adminSelectedCourse._id]?.map((chapter) => (
                    <div 
                      key={chapter._id}
                      onClick={() => {
                        setAdminSelectedChapter(chapter);
                        if (!chapterQuizzes[chapter._id]) fetchQuizzes(chapter._id);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group ${adminSelectedChapter?._id === chapter._id ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-bold transition-colors ${adminSelectedChapter?._id === chapter._id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                          {chapter.title}
                        </h4>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChapter(chapter._id);
                          }}
                          className="p-1.5 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{chapter.description}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Column 3: Quizzes */}
          <div className="flex-1 flex flex-col bg-[#111] border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-bottom border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy size={18} className="text-orange-500" />
                Quizzes
              </h3>
              {adminSelectedChapter && (
                <button 
                  onClick={() => setShowAddQuiz(true)}
                  className="p-2 bg-orange-500/10 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {!adminSelectedChapter ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 p-8 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                    <ChevronLeft size={32} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest">Select a chapter to view quizzes</p>
                </div>
              ) : (
                <>
                  {showAddQuiz && (
                    <div className="p-4 bg-white/5 border border-orange-500/30 rounded-2xl space-y-4">
                      <Input 
                        placeholder="Quiz Title"
                        value={newQuizData.title}
                        onChange={(e) => setNewQuizData({ ...newQuizData, title: e.target.value })}
                        className="text-sm"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 uppercase">Time (m)</label>
                          <input 
                            type="number" 
                            value={newQuizData.timeLimit}
                            onChange={(e) => setNewQuizData({ ...newQuizData, timeLimit: parseInt(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-gray-500 uppercase">Pass %</label>
                          <input 
                            type="number" 
                            value={newQuizData.passingScore}
                            onChange={(e) => setNewQuizData({ ...newQuizData, passingScore: parseInt(e.target.value) })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleCreateQuiz(adminSelectedChapter._id)} className="flex-1 py-2 text-xs">Create</Button>
                        <Button variant="secondary" onClick={() => setShowAddQuiz(false)} className="py-2 text-xs">Cancel</Button>
                      </div>
                    </div>
                  )}

                  {chapterQuizzes[adminSelectedChapter._id]?.map((quiz) => (
                    <div 
                      key={quiz._id}
                      onClick={() => handleManageQuestions(quiz)}
                      className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-orange-500/30 hover:bg-white/[0.08] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-400 group-hover:text-white transition-colors">
                          {quiz.title}
                        </h4>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuiz(quiz._id, adminSelectedChapter._id);
                          }}
                          className="p-1.5 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-[10px] py-0 px-2">{quiz.timeLimit} mins</Badge>
                        <Badge variant="secondary" className="text-[10px] py-0 px-2">{quiz.passingScore}% pass</Badge>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <QuestionForm 
            quizId={adminSelectedQuiz._id}
            editingQuestionId={editingQuestionId}
            onSuccess={() => {
              setEditingQuestionId(null);
              handleManageQuestions(adminSelectedQuiz);
            }}
            onCancel={() => setEditingQuestionId(null)}
            initialData={editingQuestionId ? questions.find(q => q._id === editingQuestionId) : null}
          />
          <QuestionList 
            questions={questions}
            onEdit={(q) => {
              setEditingQuestionId(q._id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDelete={async (id) => {
              if (confirm('Are you sure you want to delete this question?')) {
                await adminApi.deleteQuestion(id);
                handleManageQuestions(adminSelectedQuiz);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
