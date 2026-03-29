import React from 'react';
import { Edit, Trash2, CheckCircle2, XCircle, Code, Image as ImageIcon } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';

const QuestionList = ({ questions, onEdit, onDelete }) => {
  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-white flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
          <CheckCircle2 size={24} />
        </div>
        Question List ({questions.length})
      </h3>
      
      <div className="grid grid-cols-1 gap-6">
        {questions.map((q, index) => (
          <Card key={q._id} className="p-8 group/item" hover={false}>
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-6">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-500 font-bold">
                    {index + 1}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-white leading-relaxed">{q.questionText}</h4>
                    <div className="flex items-center gap-4">
                      {q.image && (
                        <span className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-lg">
                          <ImageIcon size={12} />
                          Image
                        </span>
                      )}
                      {q.codeSnippet && (
                        <span className="flex items-center gap-2 text-[10px] font-bold text-purple-500 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-lg">
                          <Code size={12} />
                          {q.programmingLanguage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEdit(q)}
                    className="p-3 bg-white/5 text-gray-500 hover:text-orange-500 rounded-xl transition-all"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(q._id)}
                    className="p-3 bg-white/5 text-gray-500 hover:text-red-500 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {q.codeSnippet && (
                <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d0d0d] p-4">
                  <SyntaxHighlighter
                    language={q.programmingLanguage}
                    style={atomDark}
                    customStyle={{ 
                      background: 'transparent', 
                      padding: 0, 
                      margin: 0, 
                      fontSize: '12px',
                      lineHeight: '1.5'
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
                      }
                    }}
                  >
                    {q.codeSnippet}
                  </SyntaxHighlighter>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, i) => (
                  <div 
                    key={i}
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      opt.isCorrect ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-white/5 border-white/5 text-gray-500'
                    }`}
                  >
                    <span className="text-sm font-medium">{opt.text}</span>
                    {opt.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuestionList;
