import React from 'react';
import { motion } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChevronLeft, ChevronRight, CheckCircle2, Code } from 'lucide-react';
import { Course, Chapter, Quiz, Question } from '../../types';

interface QuizViewProps {
  questions: Question[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  answers: Record<string, number[]>;
  handleAnswer: (optionIndex: number) => void;
  timeLeft: number;
  quizDuration: number;
  isSubmitted: boolean;
  setIsSubmitted: (val: boolean) => void;
  setView: (view: 'home' | 'selection' | 'quiz' | 'admin' | 'results' | 'login') => void;
  selectedCourse: Course | null;
  selectedChapter: Chapter | null;
  selectedQuiz: Quiz | null;
  formatTime: (seconds: number) => string;
  getLanguage: (subject: string | null, questionLanguage?: string) => string;
  submitQuiz: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  questions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  answers,
  handleAnswer,
  timeLeft,
  quizDuration,
  isSubmitted,
  setIsSubmitted,
  setView,
  selectedCourse,
  selectedChapter,
  selectedQuiz,
  formatTime,
  getLanguage,
  submitQuiz
}) => {
  return (
    <motion.div 
      key="quiz"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-4 gap-8"
    >
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
                  language={getLanguage(selectedCourse?.title || null, questions[currentQuestionIndex].programmingLanguage)} 
                  style={atomDark}
                  customStyle={{ 
                    background: 'transparent', 
                    padding: '1.5rem', 
                    margin: 0, 
                    fontSize: '0.9rem',
                    lineHeight: '1.6'
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
                    }
                  }}
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
                      {String.fromCharCode(65 + idx)}
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
                onClick={submitQuiz}
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
  );
};
