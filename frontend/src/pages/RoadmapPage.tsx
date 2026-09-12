import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles, BookCheck, Flame, RotateCcw } from 'lucide-react';
import { useLessons } from '../hooks/useLessons';
import { useUserState } from '../hooks/useUserState';
import { LessonCard } from '../components/LessonCard';
import { ProgressBar } from '../components/ProgressBar';

export const RoadmapPage: React.FC = () => {
  const { data: lessons, isLoading } = useLessons();
  const { userState } = useUserState();

  if (isLoading || !lessons) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-32 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const summary = userState?.summary;
  const currentLessonId = userState?.current_lesson_id || 1;
  const currentLesson = lessons.find((l) => l.id === currentLessonId) || lessons[0];
  const currentWordIndex = (userState?.current_word_index || 0) + 1;
  const currentMode = userState?.current_mode || 'learn';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner: Resume study & Overall Progress */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8 pointer-events-none">
          <BookCheck className="w-80 h-80 text-emerald-400" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Left / Center: Continue where left off */}
          <div className="lg:col-span-2 space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tiếp tục tiến độ phiên trước</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bài {currentLesson?.lesson_number}: {currentLesson?.title_en}
            </h1>
            <p className="text-slate-300 text-sm">
              Nghĩa: <span className="text-emerald-300 font-semibold">{currentLesson?.title_vi}</span> • Vị trí đang học: Từ thứ {currentWordIndex}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to={`/lesson/${currentLesson?.id}/${currentMode === 'flashcard' ? 'flashcard' : 'learn'}`}
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Học tiếp ngay</span>
              </Link>

              {summary && summary.due_reviews_count > 0 && (
                <Link
                  to="/review"
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-sm transition active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ôn tập {summary.due_reviews_count} từ đến hạn</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right: Progress Summary */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
              <span>Tổng quan toàn bộ 50 bài</span>
              <span className="text-emerald-400 font-bold text-base">
                {summary?.overall_progress_percent || 0}%
              </span>
            </div>
            <ProgressBar value={summary?.overall_progress_percent || 0} size="md" />
            <div className="grid grid-cols-2 gap-2 pt-1 text-center">
              <div className="bg-black/20 rounded-xl p-2">
                <div className="text-lg font-bold text-white">
                  {(summary?.words_learned || 0) + (summary?.words_mastered || 0)}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Từ đã thuộc</div>
              </div>
              <div className="bg-black/20 rounded-xl p-2">
                <div className="text-lg font-bold text-emerald-400">
                  {summary?.total_words || 598}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Tổng số từ</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap List */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Lộ trình 50 Bài học TOEIC
            </h2>
            <p className="text-xs text-slate-500">
              Được thiết kế chuẩn cấu trúc đề thi TOEIC. Đạt từ 80% mỗi bài để mở khóa bài tiếp theo.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            50 Bài • 598 Từ vựng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {lessons.map((lesson) => {
            const isCur = lesson.id === currentLessonId;
            return <LessonCard key={lesson.id} lesson={lesson} isCurrent={isCur} />;
          })}
        </div>
      </div>
    </div>
  );
};
