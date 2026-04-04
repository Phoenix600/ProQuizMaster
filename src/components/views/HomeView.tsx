import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { Course, Chapter, Quiz, Question } from '../../types';

interface HomeViewProps {
  setView: (view: 'home' | 'selection' | 'quiz' | 'admin' | 'results' | 'login') => void;
  courses: Course[];
  courseChapters: Record<string, Chapter[]>;
  chapterQuizzes: Record<string, Quiz[]>;
  questions: Question[];
  summaryStats: { courses: number; chapters: number; quizzes: number; questions: number };
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  setView, 
  courses, 
  courseChapters, 
  chapterQuizzes, 
  questions,
  summaryStats
}) => {
  return (
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
          { label: 'Courses', value: summaryStats.courses },
          { label: 'Chapters', value: summaryStats.chapters },
          { label: 'Quizzes', value: summaryStats.quizzes },
          { label: 'Questions', value: summaryStats.questions }
        ].map((stat, i) => (
          <div key={i} className="space-y-1">
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{stat.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
