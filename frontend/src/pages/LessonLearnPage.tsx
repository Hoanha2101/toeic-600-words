import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Layers,
  ArrowLeft,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLessonDetail } from '../hooks/useLessons';
import { useUserState } from '../hooks/useUserState';
import { useWordProgress } from '../hooks/useWordProgress';
import { PronounceButton } from '../components/PronounceButton';
import { ProgressBar } from '../components/ProgressBar';

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

  // Sync state to server on change
  useEffect(() => {
    if (lessonId && totalWords > 0) {
      updateState({
        current_lesson_id: lessonId,
        current_word_index: currentIndex,
        current_mode: 'learn',
      });
    }
  }, [lessonId, currentIndex, totalWords, updateState]);

  if (isLoading || !lesson) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-96 bg-slate-200 rounded-3xl" />
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
      // Completed lesson celebration!
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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/roadmap')}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Lộ trình</span>
        </button>

        <div className="flex items-center space-x-2">
          <Link
            to={`/lesson/${lessonId}/flashcard`}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Chuyển sang Flashcard</span>
          </Link>
        </div>
      </div>

      {/* Lesson Title & Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Bài học {lesson.lesson_number}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {lesson.title_en}
            </h1>
            <p className="text-xs text-slate-500">{lesson.title_vi}</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-extrabold text-slate-800">
              {currentIndex + 1} / {totalWords}
            </span>
            <span className="block text-[11px] text-slate-400">từ trong bài</span>
          </div>
        </div>
        <ProgressBar value={currentIndex + 1} max={totalWords} size="sm" />
      </div>

      {/* Word Card */}
      {currentWord && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Card Top Info */}
          <div className="p-8 sm:p-10 space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg">
                  {currentWord.part_of_speech || 'noun'}
                </span>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                  {currentWord.word}
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <PronounceButton
                  wordId={currentWord.id}
                  wordText={currentWord.word}
                  audioUrl={currentWord.audio_url}
                  size="lg"
                />
              </div>
            </div>

            {/* Vietnamese meaning */}
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                Nghĩa tiếng Việt
              </span>
              <p className="text-2xl font-extrabold text-emerald-900">
                {currentWord.meaning_vi}
              </p>
            </div>

            {/* English Definition */}
            {currentWord.definition_en && (
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Định nghĩa tiếng Anh
                </span>
                <p className="text-base text-slate-700 leading-relaxed font-medium">
                  "{currentWord.definition_en}"
                </p>
              </div>
            )}

            {/* Related forms */}
            {currentWord.related_forms && (
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Các từ loại liên quan
                </span>
                <p className="text-sm font-medium text-slate-600">
                  {currentWord.related_forms}
                </p>
              </div>
            )}
          </div>

          {/* Card Bottom Controls */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleToggleKnown}
              disabled={isMarking}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 border ${
                isKnown
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <CheckCircle className={`w-4 h-4 ${isKnown ? 'text-white' : 'text-slate-400'}`} />
              <span>{isKnown ? 'Đã đánh dấu thuộc từ này' : 'Đánh dấu đã thuộc'}</span>
            </button>

            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold text-xs transition disabled:opacity-30 disabled:pointer-events-none flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Từ trước</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-1"
              >
                <span>{isLastWord ? 'Hoàn thành bài' : 'Từ tiếp theo'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
