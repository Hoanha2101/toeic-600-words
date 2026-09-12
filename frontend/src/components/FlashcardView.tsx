import React, { useState, useEffect } from 'react';
import { RotateCw, Check, X, AlertTriangle, Sparkles } from 'lucide-react';
import { Word, Sm2Rating } from '../types';
import { PronounceButton } from './PronounceButton';

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

  // Reset flip when word changes
  useEffect(() => {
    setIsFlipped(false);
  }, [word.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
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

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* 3D Flip Card Container */}
      <div
        className="w-full h-80 sm:h-96 perspective-1000 cursor-pointer select-none"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT FACE */}
          <div className="absolute inset-0 w-full h-full bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-8 flex flex-col justify-between items-center text-center backface-hidden">
            <div className="w-full flex justify-between items-center text-xs font-semibold text-slate-400">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
                {word.part_of_speech || 'word'}
              </span>
              <span className="text-slate-400 flex items-center space-x-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Nhấp để lật</span>
              </span>
            </div>

            <div className="my-auto space-y-4">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                {word.word}
              </h2>
              <div className="flex items-center justify-center space-x-2">
                <PronounceButton
                  wordId={word.id}
                  wordText={word.word}
                  audioUrl={word.audio_url}
                  size="lg"
                />
                <span className="text-xs text-slate-400 font-medium">Nghe phát âm</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Nhấn phím <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">Space</kbd> để xem nghĩa
            </div>
          </div>

          {/* BACK FACE */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-white to-slate-50 rounded-3xl border-2 border-emerald-500/30 shadow-xl p-8 flex flex-col justify-between items-center text-center backface-hidden rotate-y-180">
            <div className="w-full flex justify-between items-center text-xs font-semibold text-slate-400">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                {word.part_of_speech || 'word'}
              </span>
              <PronounceButton
                wordId={word.id}
                wordText={word.word}
                audioUrl={word.audio_url}
                size="sm"
              />
            </div>

            <div className="my-auto space-y-3 w-full">
              <div className="text-slate-500 font-semibold text-lg">{word.word}</div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                {word.meaning_vi}
              </h3>
              {word.definition_en && (
                <p className="text-sm text-slate-600 italic max-w-md mx-auto">
                  "{word.definition_en}"
                </p>
              )}
              {word.related_forms && (
                <div className="text-xs text-slate-500 bg-slate-100 rounded-lg p-2 max-w-sm mx-auto">
                  <span className="font-bold">Từ loại liên quan:</span> {word.related_forms}
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Chọn mức độ nhớ bên dưới để tiếp tục
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
            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 active:scale-95 transition disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition">
              <X className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-red-700">Quên</span>
            <span className="text-[10px] text-red-500 hidden sm:inline font-mono">1 • 1 ngày</span>
          </button>

          {/* Hard */}
          <button
            type="button"
            disabled={isSubmitting || !isFlipped}
            onClick={(e) => {
              e.stopPropagation();
              onRate('hard');
            }}
            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 active:scale-95 transition disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-amber-700">Khó</span>
            <span className="text-[10px] text-amber-500 hidden sm:inline font-mono">2 • Nhắc lại</span>
          </button>

          {/* Good */}
          <button
            type="button"
            disabled={isSubmitting || !isFlipped}
            onClick={(e) => {
              e.stopPropagation();
              onRate('good');
            }}
            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 border border-blue-200 active:scale-95 transition disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-blue-700">Nhớ</span>
            <span className="text-[10px] text-blue-500 hidden sm:inline font-mono">3 • Tốt</span>
          </button>

          {/* Easy */}
          <button
            type="button"
            disabled={isSubmitting || !isFlipped}
            onClick={(e) => {
              e.stopPropagation();
              onRate('easy');
            }}
            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 active:scale-95 transition disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-700">Dễ</span>
            <span className="text-[10px] text-emerald-500 hidden sm:inline font-mono">4 • Thuần thục</span>
          </button>
        </div>
      </div>
    </div>
  );
};
