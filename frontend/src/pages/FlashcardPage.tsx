import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, RotateCcw, Award, CheckCircle2, PenTool } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLessonDetail } from '../hooks/useLessons';
import { useUserState } from '../hooks/useUserState';
import { useWordProgress } from '../hooks/useWordProgress';
import { FlashcardView } from '../components/FlashcardView';
import { ProgressBar } from '../components/ProgressBar';
import { ScratchPad } from '../components/ScratchPad';
import { preloadAudio } from '../lib/audio';
import { Sm2Rating } from '../types';
import { cn } from '../lib/utils';

export const FlashcardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const lessonId = parseInt(id || '1', 10);
  const navigate = useNavigate();

  const { data: lesson, isLoading } = useLessonDetail(lessonId);
  const { userState, updateState } = useUserState();
  const { reviewWord, isReviewing } = useWordProgress();

  const words = lesson?.words || [];
  const totalWords = words.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showScratchPad, setShowScratchPad] = useState(false);
  const [mobilePadOpen, setMobilePadOpen] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ again: number; hard: number; good: number; easy: number }>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (lessonId && totalWords > 0 && !isCompleted) {
      updateState({
        current_lesson_id: lessonId,
        current_word_index: currentIndex,
        current_mode: 'flashcard',
      });
    }
  }, [lessonId, currentIndex, totalWords, isCompleted, updateState]);

  // Preload audio for upcoming word
  useEffect(() => {
    const nextWord = words[currentIndex + 1];
    if (nextWord) {
      preloadAudio(nextWord.id, nextWord.word, nextWord.audio_url);
    }
  }, [currentIndex, words]);

  if (isLoading || !lesson) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mx-auto" />
        <div className="h-80 bg-slate-200 dark:bg-slate-700 rounded-3xl" />
      </div>
    );
  }

  const currentWord = words[currentIndex];

  const handleRate = async (rating: Sm2Rating) => {
    if (!currentWord || isReviewing) return;

    // Call backend SM-2 review mutation
    reviewWord({
      wordId: currentWord.id,
      rating,
    });

    setSessionResults((prev) => ({
      ...prev,
      [rating]: prev[rating] + 1,
    }));

    if (currentIndex < totalWords - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsCompleted(false);
    setSessionResults({ again: 0, hard: 0, good: 0, easy: 0 });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/roadmap')}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Lộ trình</span>
        </button>

        <div className="flex items-center space-x-2">
          {!isCompleted && currentWord && (
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
          )}

          <Link
            to={`/lesson/${lessonId}/learn`}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold min-h-[44px] transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Chế độ đọc từ</span>
          </Link>
        </div>
      </div>

      {/* Title & Progress */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Flashcard • Bài {lesson.lesson_number}
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
          {lesson.title_en}
        </h1>
        <div className="max-w-md mx-auto space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-400">
            <span>Thẻ {currentIndex + 1} / {totalWords}</span>
            <span>{Math.round(((currentIndex + 1) / totalWords) * 100)}%</span>
          </div>
          <ProgressBar value={currentIndex + 1} max={totalWords} size="sm" />
        </div>
      </div>

      {/* Main Flashcard View or Completion Screen */}
      {isCompleted ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 text-center space-y-6 max-w-xl mx-auto transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Hoàn thành phiên Flashcard!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Bạn đã ôn tập toàn bộ {totalWords} từ vựng trong bài học này.
            </p>
          </div>

          {/* Results breakdown */}
          <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
            <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-100 dark:border-red-900">
              <div className="text-xl font-bold text-red-600 dark:text-red-400">{sessionResults.again}</div>
              <div className="text-[11px] font-semibold text-red-700 dark:text-red-300">Quên</div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{sessionResults.hard}</div>
              <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Khó</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{sessionResults.good}</div>
              <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">Nhớ</div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{sessionResults.easy}</div>
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Dễ</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center space-x-2 min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ôn lại bài này</span>
            </button>
            <Link
              to="/roadmap"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2 min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tiếp tục lộ trình</span>
            </Link>
          </div>
        </div>
      ) : currentWord ? (
        <div className={cn('grid grid-cols-1 gap-6', showScratchPad ? 'lg:grid-cols-12' : 'max-w-xl mx-auto')}>
          <div className={cn(showScratchPad ? 'lg:col-span-7' : 'w-full')}>
            <FlashcardView
              key={`card-${currentWord.id}`}
              word={currentWord}
              onRate={handleRate}
              isSubmitting={isReviewing}
            />
          </div>

          {showScratchPad && (
            <div className="hidden lg:block lg:col-span-5 h-full">
              <ScratchPad
                wordId={currentWord.id}
                wordText={currentWord.word}
                onClose={() => setShowScratchPad(false)}
                className="h-full min-h-[420px]"
              />
            </div>
          )}
        </div>
      ) : null}

      {/* Floating Action Button for Mobile Scratch Pad */}
      {!isCompleted && currentWord && (
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
      )}

      {/* Mobile Scratch Pad Modal */}
      {mobilePadOpen && currentWord && (
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
