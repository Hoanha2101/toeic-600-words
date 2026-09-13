import React, { useState, useEffect, useRef } from 'react';
import { RotateCw, Check, X, AlertTriangle, Sparkles } from 'lucide-react';
import { Word, Sm2Rating } from '../types';
import { PronounceButton } from './PronounceButton';
import { cn } from '../lib/utils';

interface FlashcardViewProps {
  word: Word;
  onRate: (rating: Sm2Rating) => void;
  isSubmitting?: boolean;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  word,
  onRate,
  isSubmitting = false,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Reset flip when word changes
  useEffect(() => {
    setIsFlipped(false);
  }, [word.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped && !isSubmitting) {
        if (e.key === '1') {
          e.preventDefault();
          onRate('again');
        } else if (e.key === '2') {
          e.preventDefault();
          onRate('hard');
        } else if (e.key === '3') {
          e.preventDefault();
          onRate('good');
        } else if (e.key === '4') {
          e.preventDefault();
          onRate('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isSubmitting, onRate]);

  // Mobile swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Swipe threshold 40px
    if (Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX)) {
      // Vertical swipe: Flip card!
      setIsFlipped((prev) => !prev);
    } else if (Math.abs(diffX) > 60 && isFlipped && !isSubmitting) {
      // Horizontal swipe when flipped:
      if (diffX < 0) {
        // Swipe left: again
        onRate('again');
      } else {
        // Swipe right: good
        onRate('good');
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* 3D Flip Card Container */}
      <div
        className="w-full h-80 sm:h-96 perspective-1000 cursor-pointer select-none"
        onClick={() => setIsFlipped(!isFlipped)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={cn(
            'relative w-full h-full transition-transform duration-500 transform-style-3d',
            isFlipped ? 'rotate-y-180' : ''
          )}
        >
          {/* FRONT FACE */}
          <div className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-xl p-6 sm:p-8 flex flex-col justify-between items-center text-center backface-hidden transition-colors">
            <div className="w-full flex justify-between items-center text-xs font-semibold text-slate-400 dark:text-slate-500">
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">
                {word.part_of_speech || 'word'}
              </span>
              <span className="text-slate-400 dark:text-slate-400 flex items-center space-x-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Chạm để lật</span>
              </span>
            </div>

            <div className="my-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {word.word}
              </h2>
              <div className="flex items-center justify-center space-x-2">
                <PronounceButton
                  key={`front-audio-${word.id}`}
                  wordId={word.id}
                  wordText={word.word}
                  audioUrl={word.audio_url}
                  size="lg"
                />
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Nghe phát âm</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Nhấn phím <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-mono">Space</kbd> hoặc chạm để xem nghĩa
            </div>
          </div>

          {/* BACK FACE */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-xl p-6 sm:p-8 flex flex-col justify-between items-center text-center backface-hidden rotate-y-180 transition-colors">
            <div className="w-full flex justify-between items-center text-xs font-semibold text-slate-400">
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
                {word.part_of_speech || 'word'}
              </span>
              <PronounceButton
                key={`back-audio-${word.id}`}
                wordId={word.id}
                wordText={word.word}
                audioUrl={word.audio_url}
                size="sm"
              />
            </div>

            <div className="my-auto space-y-3 w-full">
              <div className="text-slate-500 dark:text-slate-400 font-semibold text-base sm:text-lg">{word.word}</div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {word.meaning_vi}
              </h3>
              {word.definition_en && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic max-w-md mx-auto line-clamp-2">
                  "{word.definition_en}"
                </p>
              )}
              {word.related_forms && (
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 rounded-xl p-2 max-w-sm mx-auto">
                  <span className="font-bold">Từ loại liên quan:</span> {word.related_forms}
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Đánh giá mức độ nhớ bên dưới
            </div>
          </div>
        </div>
      </div>

      {/* SM-2 Rating Buttons (Shown when flipped) */}
      <div className={`mt-6 transition-all duration-300 ${isFlipped ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {/* Again */}
          <button
            type="button"
            disabled={isSubmitting || !isFlipped}
            onClick={(e) => {
              e.stopPropagation();
              onRate('again');
            }}
            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-800 active:scale-95 transition disabled:opacity-50 min-h-[52px]"
          >
            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center mb-1 shadow-sm group-hover:scale-110 transition">
              <X className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-red-700 dark:text-red-300">Quên</span>
            <span className="text-[10px] text-red-500 dark:text-red-400 hidden sm:inline font-mono">1 • 1 ngày</span>
          </button>

          {/* Hard */}
          <button
            type="button"
            disabled={isSubmitting || !isFlipped}
            onClick={(e) => {
              e.stopPropagation();
              onRate('hard');
            }}
            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-800 active:scale-95 transition disabled:opacity-50 min-h-[52px]"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center mb-1 shadow-sm group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Khó</span>
            <span className="text-[10px] text-amber-500 dark:text-amber-400 hidden sm:inline font-mono">2 • Lặp lại</span>
          </button>

          {/* Good */}
          <button
            type="button"
            disabled={isSubmitting || !isFlipped}
            onClick={(e) => {
              e.stopPropagation();
              onRate('good');
            }}
            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 border border-blue-200 dark:border-blue-800 active:scale-95 transition disabled:opacity-50 min-h-[52px]"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mb-1 shadow-sm group-hover:scale-110 transition">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Nhớ</span>
            <span className="text-[10px] text-blue-500 dark:text-blue-400 hidden sm:inline font-mono">3 • Chuẩn</span>
          </button>

          {/* Easy */}
          <button
            type="button"
            disabled={isSubmitting || !isFlipped}
            onClick={(e) => {
              e.stopPropagation();
              onRate('easy');
            }}
            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 active:scale-95 transition disabled:opacity-50 min-h-[52px]"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1 shadow-sm group-hover:scale-110 transition">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Dễ</span>
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 hidden sm:inline font-mono">4 • Thuần thục</span>
          </button>
        </div>
      </div>
    </div>
  );
};
