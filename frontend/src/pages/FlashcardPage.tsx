import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, RotateCcw, Award, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLessonDetail } from '../hooks/useLessons';
import { useUserState } from '../hooks/useUserState';
import { useWordProgress } from '../hooks/useWordProgress';
import { FlashcardView } from '../components/FlashcardView';
import { ProgressBar } from '../components/ProgressBar';
import { Sm2Rating } from '../types';

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

  if (isLoading || !lesson) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 rounded w-1/4 mx-auto" />
        <div className="h-80 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  const currentWord = words[currentIndex];

  const handleRate = async (rating: Sm2Rating) => {
    if (!currentWord || isReviewing) return;

    // Call backend SM-2 review mutation immediately
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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/roadmap')}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Lộ trình</span>
        </button>

        <Link
          to={`/lesson/${lessonId}/learn`}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Chế độ đọc từ</span>
        </Link>
      </div>

      {/* Title & Progress */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
          Flashcard • Bài {lesson.lesson_number}
        </span>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
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

      {/* Main Flashcard or Completion Screen */}
      {isCompleted ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Hoàn thành phiên Flashcard!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Bạn đã ôn tập toàn bộ {totalWords} từ vựng trong bài học này.
            </p>
          </div>

          {/* Results breakdown */}
          <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
            <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
              <div className="text-xl font-bold text-red-600">{sessionResults.again}</div>
              <div className="text-[11px] font-semibold text-red-700">Quên</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
              <div className="text-xl font-bold text-amber-600">{sessionResults.hard}</div>
              <div className="text-[11px] font-semibold text-amber-700">Khó</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="text-xl font-bold text-blue-600">{sessionResults.good}</div>
              <div className="text-[11px] font-semibold text-blue-700">Nhớ</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="text-xl font-bold text-emerald-600">{sessionResults.easy}</div>
              <div className="text-[11px] font-semibold text-emerald-700">Dễ</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ôn lại bài này</span>
            </button>
            <Link
              to="/roadmap"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tiếp tục lộ trình</span>
            </Link>
          </div>
        </div>
      ) : currentWord ? (
        <FlashcardView
          word={currentWord}
          onRate={handleRate}
          isSubmitting={isReviewing}
        />
      ) : null}
    </div>
  );
};
