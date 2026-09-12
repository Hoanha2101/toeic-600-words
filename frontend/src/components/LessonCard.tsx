import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { Lesson } from '../types';
import { ProgressBar } from './ProgressBar';

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
      className={`relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        isCurrent
          ? 'border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
          : isCompleted
          ? 'border-emerald-200/80 hover:border-emerald-300 shadow-sm'
          : 'border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800'
                : isStarted
                ? 'bg-blue-50 text-blue-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            Bài {lesson_number}
          </span>

          {isCompleted ? (
            <span className="flex items-center space-x-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã thuộc</span>
            </span>
          ) : isCurrent ? (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Đang học dở
            </span>
          ) : null}
        </div>

        <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-1" title={title_en}>
          {title_en}
        </h3>
        <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-1" title={title_vi}>
          {title_vi}
        </p>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Đã học {progress.words_learned}/{progress.words_total} từ</span>
            <span className={isCompleted ? 'text-emerald-600 font-bold' : ''}>
              {progress.progress_percent}%
            </span>
          </div>
          <ProgressBar value={progress.progress_percent} size="sm" />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 pb-5 pt-1 grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/50">
        <Link
          to={`/lesson/${id}/learn`}
          className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-700 font-semibold text-xs transition"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Học từ mới</span>
        </Link>
        <Link
          to={`/lesson/${id}/flashcard`}
          className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Flashcard</span>
        </Link>
      </div>
    </div>
  );
};
