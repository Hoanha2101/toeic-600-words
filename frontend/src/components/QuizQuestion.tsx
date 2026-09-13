import React, { useState, useEffect } from 'react';
import { Volume2, HelpCircle } from 'lucide-react';
import { TestQuestion } from '../types';
import { PronounceButton } from './PronounceButton';
import { cn } from '../lib/utils';

interface QuizQuestionProps {
  question: TestQuestion;
  selectedAnswer?: string;
  onSelectAnswer: (answer: string) => void;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  selectedAnswer = '',
  onSelectAnswer,
}) => {
  const [fillInput, setFillInput] = useState(selectedAnswer);

  useEffect(() => {
    setFillInput(selectedAnswer);
  }, [selectedAnswer, question.question_index]);

  const { question_type, prompt, options, blank_length, hint, audio_url, audio_word, audio_word_id, word_id } = question;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFillInput(val);
    onSelectAnswer(val);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 sm:p-8 max-w-2xl mx-auto transition-colors">
      {/* Header / Type Badge */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
          {question_type === 'multiple_choice' && 'Trắc nghiệm nghĩa (EN ➔ VI)'}
          {question_type === 'reverse' && 'Trắc nghiệm ngược (VI ➔ EN)'}
          {question_type === 'listening' && 'Nghe và chọn từ đúng'}
          {question_type === 'fill_blank' && 'Điền từ tiếng Anh đúng'}
        </span>
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
          Câu {question.question_index + 1}
        </span>
      </div>

      {/* Prompt */}
      <div className="text-center my-6 space-y-4">
        {question_type === 'listening' ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-4">
            <PronounceButton
              key={`listening-audio-${question.question_index}-${word_id}`}
              wordId={audio_word_id || word_id}
              wordText={audio_word || ''}
              audioUrl={audio_url}
              size="lg"
            />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Nhấp vào loa để nghe phát âm, sau đó chọn từ chính xác
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {prompt}
            </h3>
            {hint && (
              <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-700/50 py-1.5 px-3.5 rounded-xl inline-block border border-slate-200 dark:border-slate-600">
                Gợi ý: {hint}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Answer Options */}
      {question_type === 'fill_blank' ? (
        <div className="mt-8 max-w-md mx-auto space-y-3">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">
            Nhập từ tiếng Anh ({blank_length} ký tự):
          </label>
          <input
            type="text"
            value={fillInput}
            onChange={handleInputChange}
            placeholder="Gõ đáp án tại đây..."
            className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 text-base sm:text-lg font-semibold transition outline-none min-h-[48px]"
            autoFocus
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {options?.map((opt, idx) => {
            const isSelected = selectedAnswer === opt;
            const letter = String.fromCharCode(65 + idx); // A, B, C, D
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectAnswer(opt)}
                className={cn(
                  'flex items-center space-x-3 p-4 rounded-2xl border-2 text-left transition-all min-h-[48px]',
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 shadow-md ring-2 ring-emerald-600/20 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200'
                )}
              >
                <span
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0',
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  )}
                >
                  {letter}
                </span>
                <span className="text-sm sm:text-base leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
