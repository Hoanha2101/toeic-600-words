import React, { useState, useEffect } from 'react';
import { Info, Volume2, Check } from 'lucide-react';
import { TestQuestion } from '../types';
import { PronounceButton } from './PronounceButton';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from './ui/tooltip';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from './ui/popover';
import { cn } from '../lib/utils';

interface QuizQuestionProps {
  question: TestQuestion;
  selectedAnswer?: string;
  onSelectAnswer: (answer: string) => void;
  showHints?: boolean;
  autoPlayAudio?: boolean;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  selectedAnswer = '',
  onSelectAnswer,
  showHints = true,
  autoPlayAudio = false,
}) => {
  const [fillInput, setFillInput] = useState(selectedAnswer);
  const [listenPlayCount, setListenPlayCount] = useState<number>(0);

  useEffect(() => {
    setFillInput(selectedAnswer);
    setListenPlayCount(0);
  }, [selectedAnswer, question.question_index]);

  const {
    question_type,
    prompt,
    options,
    options_detail,
    blank_length,
    hint,
    audio_url,
    audio_word,
    audio_word_id,
    word_id,
  } = question;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFillInput(val);
    onSelectAnswer(val);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 sm:p-8 max-w-2xl mx-auto transition-all duration-300">
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

        {/* Question Prompt */}
        <div className="text-center my-6 space-y-4">
          {question_type === 'listening' ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-4">
              <div className="relative">
                <PronounceButton
                  key={`listening-audio-${question.question_index}-${word_id}`}
                  wordId={audio_word_id || word_id}
                  wordText={audio_word || ''}
                  audioUrl={audio_url}
                  size="xl"
                  onPlay={() => setListenPlayCount((prev) => prev + 1)}
                />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  Nhấp vào loa hoặc nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-xs">Space</kbd> để nghe
                </p>
                <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Đã nghe: {listenPlayCount} lần</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
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
              const detail = options_detail?.[idx];

              // Definition content for tooltip / popover
              const definitionCard = detail ? (
                <div className="space-y-1 text-left max-w-xs p-1">
                  <div className="flex items-center space-x-1.5">
                    {detail.part_of_speech && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                        {detail.part_of_speech}
                      </span>
                    )}
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                      {detail.word || opt}
                    </span>
                  </div>
                  {detail.meaning_vi && (
                    <p className="font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                      {detail.meaning_vi}
                    </p>
                  )}
                  {detail.definition_en && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                      "{detail.definition_en}"
                    </p>
                  )}
                </div>
              ) : null;

              const buttonElement = (
                <button
                  type="button"
                  onClick={() => onSelectAnswer(opt)}
                  className={cn(
                    'relative w-full flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all duration-200 min-h-[56px] group',
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 shadow-md ring-2 ring-emerald-600/30 font-bold scale-[1.01]'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200'
                  )}
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <span
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors',
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200'
                      )}
                    >
                      {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : letter}
                    </span>
                    <span className="text-sm sm:text-base leading-snug break-words">
                      {opt}
                    </span>
                  </div>

                  {/* Right Action: Mobile Popover ⓘ & Desktop Tooltip indicator */}
                  {showHints && detail && (
                    <div className="flex items-center flex-shrink-0 ml-1">
                      {/* Mobile Popover Trigger ⓘ */}
                      <div className="sm:hidden">
                        <Popover>
                          <PopoverTrigger asChild>
                            <span
                              role="button"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Xem chú thích nghĩa"
                            >
                              <Info className="w-4 h-4" />
                            </span>
                          </PopoverTrigger>
                          <PopoverContent side="top" align="center">
                            {definitionCard}
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Desktop indicator hint */}
                      <span className="hidden sm:inline-flex p-1 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition">
                        <Info className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}
                </button>
              );

              // On Desktop: Wrap in Radix Tooltip if hints enabled
              if (showHints && detail) {
                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
                    <TooltipContent side="top" className="hidden sm:block">
                      {definitionCard}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return <React.Fragment key={idx}>{buttonElement}</React.Fragment>;
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
