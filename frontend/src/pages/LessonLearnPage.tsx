import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Layers,
  ArrowLeft,
  Sparkles,
  BookOpen,
  PenTool,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLessonDetail } from '../hooks/useLessons';
import { useUserState } from '../hooks/useUserState';
import { useWordProgress } from '../hooks/useWordProgress';
import { PronounceButton } from '../components/PronounceButton';
import { ProgressBar } from '../components/ProgressBar';
import { ScratchPad } from '../components/ScratchPad';
import { preloadAudio } from '../lib/audio';
import { cn } from '../lib/utils';

export const LessonLearnPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const lessonId = parseInt(id || '1', 10);
  const navigate = useNavigate();

  const { data: lesson, isLoading } = useLessonDetail(lessonId);
  const { userState, updateState } = useUserState();
  const { markKnown, isMarking } = useWordProgress();

  const words = lesson?.words || [];
  const totalWords = words.length;

  // Initialize index from userState if matching this lesson
  const initialIndex =
    userState?.current_lesson_id === lessonId && userState.current_word_index < totalWords
      ? userState.current_word_index
      : 0;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showScratchPad, setShowScratchPad] = useState(false);
  const [mobilePadOpen, setMobilePadOpen] = useState(false);

  // Debounced state update to server (300ms) with flush support
  const pendingUpdateRef = useRef<{ lessonId: number; index: number } | null>(null);

  useEffect(() => {
    if (lessonId && totalWords > 0) {
      pendingUpdateRef.current = { lessonId, index: currentIndex };
      const timer = setTimeout(() => {
        if (pendingUpdateRef.current) {
          updateState({
            current_lesson_id: pendingUpdateRef.current.lessonId,
            current_word_index: pendingUpdateRef.current.index,
            current_mode: 'learn',
          });
          pendingUpdateRef.current = null;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [lessonId, currentIndex, totalWords, updateState]);

  // Flush on page unload or visibility change
  useEffect(() => {
    const flushState = () => {
      if (pendingUpdateRef.current) {
        updateState({
          current_lesson_id: pendingUpdateRef.current.lessonId,
          current_word_index: pendingUpdateRef.current.index,
          current_mode: 'learn',
        });
        pendingUpdateRef.current = null;
      }
    };
    window.addEventListener('beforeunload', flushState);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushState();
    });
    return () => {
      window.removeEventListener('beforeunload', flushState);
    };
  }, [updateState]);

  // Preload audio for upcoming word
  useEffect(() => {
    const nextWord = words[currentIndex + 1];
    if (nextWord) {
      preloadAudio(nextWord.id, nextWord.word, nextWord.audio_url);
    }
  }, [currentIndex, words]);

  if (isLoading || !lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-3xl" />
      </div>
    );
  }

  const currentWord = words[currentIndex] || words[0];
  const isKnown = currentWord?.is_marked_known || currentWord?.status === 'mastered';
  const isLastWord = currentIndex === totalWords - 1;

  const handleNext = () => {
    if (currentIndex < totalWords - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleToggleKnown = () => {
    if (!currentWord) return;
    markKnown({
      wordId: currentWord.id,
      isMarkedKnown: !isKnown,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Navigation & Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/roadmap')}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Lộ trình</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Toggle Scratch Pad (Desktop) */}
          <button
            type="button"
            onClick={() => setShowScratchPad(!showScratchPad)}
            className={cn(
              'hidden lg:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition min-h-[44px] border',
              showScratchPad
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            )}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{showScratchPad ? 'Ẩn giấy nháp' : 'Mở giấy nháp'}</span>
          </button>

          <Link
            to={`/lesson/${lessonId}/flashcard`}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 min-h-[44px] transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Chế độ Flashcard</span>
          </Link>
        </div>
      </div>

      {/* Lesson Title & Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Bài học {lesson.lesson_number}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {lesson.title_en}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{lesson.title_vi}</p>
          </div>
          <div className="text-right">
            <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-200">
              {currentIndex + 1} / {totalWords}
            </span>
            <span className="block text-[11px] text-slate-400">từ trong bài</span>
          </div>
        </div>
        <ProgressBar value={currentIndex + 1} max={totalWords} size="sm" />
      </div>

      {/* Main Grid: Word Details + Scratch Pad */}
      <div className={cn('grid grid-cols-1 gap-6', showScratchPad ? 'lg:grid-cols-12' : 'max-w-3xl mx-auto')}>
        {/* Word Card */}
        <div
          className={cn(
            'bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col justify-between transition-colors',
            showScratchPad ? 'lg:col-span-7' : 'w-full'
          )}
        >
          {/* Card Top Info */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg">
                  {currentWord.part_of_speech || 'noun'}
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {currentWord.word}
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <PronounceButton
                  key={`word-audio-${currentWord.id}`}
                  wordId={currentWord.id}
                  wordText={currentWord.word}
                  audioUrl={currentWord.audio_url}
                  size="lg"
                />
              </div>
            </div>

            {/* Vietnamese meaning */}
            <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-1">
                Nghĩa tiếng Việt
              </span>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-900 dark:text-emerald-200">
                {currentWord.meaning_vi}
              </p>
            </div>

            {/* English Definition */}
            {currentWord.definition_en && (
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Định nghĩa tiếng Anh
                </span>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  "{currentWord.definition_en}"
                </p>
              </div>
            )}

            {/* Related forms */}
            {currentWord.related_forms && (
              <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Các từ loại liên quan
                </span>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {currentWord.related_forms}
                </p>
              </div>
            )}
          </div>

          {/* Card Bottom Controls */}
          <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleToggleKnown}
              disabled={isMarking}
              className={cn(
                'w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 border min-h-[44px]',
                isKnown
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
              )}
            >
              <CheckCircle className={cn('w-4 h-4', isKnown ? 'text-white' : 'text-slate-400')} />
              <span>{isKnown ? 'Đã đánh dấu thuộc từ này' : 'Đánh dấu đã thuộc'}</span>
            </button>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs transition disabled:opacity-30 disabled:pointer-events-none flex items-center space-x-1 min-h-[44px]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Từ trước</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-1 min-h-[44px]"
              >
                <span>{isLastWord ? 'Hoàn thành bài' : 'Từ tiếp theo'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scratch Pad Column (Desktop) */}
        {showScratchPad && (
          <div className="hidden lg:block lg:col-span-5 h-full">
            <ScratchPad
              wordId={currentWord.id}
              wordText={currentWord.word}
              onClose={() => setShowScratchPad(false)}
              className="h-full min-h-[450px]"
            />
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) for Mobile Scratch Pad */}
      <div className="lg:hidden fixed bottom-20 right-5 z-30">
        <button
          type="button"
          onClick={() => setMobilePadOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition"
          title="Mở giấy nháp"
        >
          <PenTool className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Scratch Pad Bottom Sheet Modal */}
      {mobilePadOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end p-2 sm:p-4">
          <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
            <ScratchPad
              wordId={currentWord.id}
              wordText={currentWord.word}
              onClose={() => setMobilePadOpen(false)}
              isMobileModal={true}
              className="border-0 shadow-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
