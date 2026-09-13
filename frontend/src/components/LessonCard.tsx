import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Layers, CheckCircle2, Sparkles } from 'lucide-react';
import { Lesson } from '../types';
import { ProgressBar } from './ProgressBar';
import { cn } from '../lib/utils';

interface LessonCardProps {
  lesson: Lesson;
  isCurrent?: boolean;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, isCurrent = false }) => {
  const { id, lesson_number, title_en, title_vi, progress } = lesson;
  const isCompleted = progress.is_completed || progress.progress_percent >= 100;
  const isStarted = progress.words_learned > 0;

  return (
    <div
      className={cn(
        'relative bg-white dark:bg-slate-800/95 rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between hover:shadow-lg',
        isCurrent
          ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30 dark:ring-emerald-400/30'
          : isCompleted
          ? 'border-emerald-200 dark:border-emerald-900/60 shadow-sm'
          : 'border-slate-200 dark:border-slate-700/80 shadow-sm'
      )}
    >
      {/* Header */}
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <span
            className={cn(
              'text-xs font-black px-3 py-1 rounded-xl',
              isCompleted
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                : isStarted
                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            )}
          >
            Bài {lesson_number}
          </span>

          {isCompleted ? (
            <span className="flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã thuộc</span>
            </span>
          ) : isCurrent ? (
            <span className="flex items-center space-x-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 animate-pulse">
              <Sparkles className="w-3 h-3" />
              <span>Đang học dở</span>
            </span>
          ) : null}
        </div>

        <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg mb-1 line-clamp-1" title={title_en}>
          {title_en}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mb-4 line-clamp-1" title={title_vi}>
          {title_vi}
        </p>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Đã học {progress.words_learned}/{progress.words_total} từ</span>
            <span className={isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}>
              {progress.progress_percent}%
            </span>
          </div>
          <ProgressBar value={progress.progress_percent} size="sm" />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 pb-5 pt-2 grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/40">
        <Link
          to={`/lesson/${id}/learn`}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 font-bold text-xs transition min-h-[44px]"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Học từ</span>
        </Link>
        <Link
          to={`/lesson/${id}/flashcard`}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition min-h-[44px]"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Flashcard</span>
        </Link>
      </div>
    </div>
  );
};
