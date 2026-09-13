import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Sparkles,
  BookCheck,
  RotateCcw,
  Compass,
  CheckCircle2,
  Lock,
  Layers,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  MapPin,
} from 'lucide-react';
import { useLessons } from '../hooks/useLessons';
import { useUserState } from '../hooks/useUserState';
import { LessonCard } from '../components/LessonCard';
import { ProgressBar } from '../components/ProgressBar';
import { cn } from '../lib/utils';
import { Lesson } from '../types';

interface Stage {
  id: number;
  title: string;
  desc: string;
  icon: string;
  startLesson: number;
  endLesson: number;
}

const STAGES: Stage[] = [
  { id: 1, title: 'Chặng 1: Nền tảng Doanh nghiệp & Hợp đồng', desc: 'Bài 1 - 10: Contracts, Marketing, Warranties...', icon: '🏢', startLesson: 1, endLesson: 10 },
  { id: 2, title: 'Chặng 2: Tiếp thị, Bán hàng & Tài chính', desc: 'Bài 11 - 20: Accounting, Finance, Investments...', icon: '📈', startLesson: 11, endLesson: 20 },
  { id: 3, title: 'Chặng 3: Văn phòng & Công nghệ thông tin', desc: 'Bài 21 - 30: Computers, Office tech, Operations...', icon: '💻', startLesson: 21, endLesson: 30 },
  { id: 4, title: 'Chặng 4: Du lịch, Hàng không & Nhà hàng', desc: 'Bài 31 - 40: Travel, Airlines, Hotels, Dining...', icon: '✈️', startLesson: 31, endLesson: 40 },
  { id: 5, title: 'Chặng 5: Y tế, Truyền thông & Đời sống', desc: 'Bài 41 - 50: Health, Media, Pharmacy, Medical...', icon: '🏥', startLesson: 41, endLesson: 50 },
];

export const RoadmapPage: React.FC = () => {
  const { data: lessons, isLoading } = useLessons();
  const { userState } = useUserState();
  const [viewMode, setViewMode] = useState<'journey' | 'grid'>('journey');
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
  });

  if (isLoading || !lessons) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const summary = userState?.summary;
  const currentLessonId = userState?.current_lesson_id || 1;
  const currentLesson = lessons.find((l) => l.id === currentLessonId || l.lesson_number === currentLessonId) || lessons[0];
  const currentWordIndex = (userState?.current_word_index || 0) + 1;
  const currentMode = userState?.current_mode || 'learn';

  const toggleStage = (stageId: number) => {
    setExpandedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Hero Banner: Resume study & Overall Progress */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 pointer-events-none">
          <BookCheck className="w-80 h-80 text-emerald-400" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Left / Center: Continue where left off */}
          <div className="lg:col-span-2 space-y-3">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tiếp tục tiến độ phiên trước</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Bài {currentLesson?.lesson_number}: {currentLesson?.title_en}
            </h1>
            <p className="text-slate-300 text-sm">
              Nghĩa: <span className="text-emerald-300 font-semibold">{currentLesson?.title_vi}</span> • Vị trí: Từ thứ {currentWordIndex}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to={`/lesson/${currentLesson?.id}/${currentMode === 'flashcard' ? 'flashcard' : 'learn'}`}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/30 transition active:scale-95 min-h-[44px]"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Học tiếp ngay</span>
              </Link>

              {summary && summary.due_reviews_count > 0 && (
                <Link
                  to="/review"
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-sm transition active:scale-95 min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ôn {summary.due_reviews_count} từ đến hạn</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right: Progress Summary */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-300">
              <span>Tiến độ toàn bộ 50 bài</span>
              <span className="text-emerald-400 font-black text-lg">
                {summary?.overall_progress_percent || 0}%
              </span>
            </div>
            <ProgressBar value={summary?.overall_progress_percent || 0} size="md" />
            <div className="grid grid-cols-2 gap-2 pt-1 text-center">
              <div className="bg-black/30 rounded-xl p-2.5">
                <div className="text-lg font-black text-white">
                  {(summary?.words_learned || 0) + (summary?.words_mastered || 0)}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Từ đã thuộc</div>
              </div>
              <div className="bg-black/30 rounded-xl p-2.5">
                <div className="text-lg font-black text-emerald-400">
                  {summary?.total_words || 598}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tổng số từ</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: View Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Compass className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Hành trình 50 Bài Học TOEIC</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Mỗi chặng mở ra kiến thức thực tế trong kỳ thi TOEIC chuẩn quốc tế.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setViewMode('journey')}
            className={cn(
              'flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition min-h-[40px]',
              viewMode === 'journey'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Bản đồ hành trình</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition min-h-[40px]',
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Dạng lưới thẻ</span>
          </button>
        </div>
      </div>

      {/* STAGE-BASED JOURNEY OR GRID */}
      {viewMode === 'journey' ? (
        <div className="space-y-8">
          {STAGES.map((stage) => {
            const stageLessons = lessons.filter(
              (l) => l.lesson_number >= stage.startLesson && l.lesson_number <= stage.endLesson
            );
            const stageTotalWords = stageLessons.reduce((acc, l) => acc + l.progress.words_total, 0);
            const stageLearnedWords = stageLessons.reduce((acc, l) => acc + l.progress.words_learned, 0);
            const stagePct = stageTotalWords > 0 ? Math.round((stageLearnedWords / stageTotalWords) * 100) : 0;
            const isExpanded = expandedStages[stage.id] ?? true;

            return (
              <div
                key={stage.id}
                className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden transition-colors"
              >
                {/* Stage Header */}
                <button
                  type="button"
                  onClick={() => toggleStage(stage.id)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition min-h-[44px]"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                      {stage.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                        {stage.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {stage.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0 ml-2">
                    <div className="hidden sm:block text-right">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        {stageLearnedWords}/{stageTotalWords} từ ({stagePct}%)
                      </span>
                      <div className="w-24 mt-1">
                        <ProgressBar value={stagePct} size="sm" />
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Stage Lesson Grid */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {stageLessons.map((lesson) => {
                        const isCur = lesson.id === currentLessonId || lesson.lesson_number === currentLessonId;
                        return <LessonCard key={lesson.id} lesson={lesson} isCurrent={isCur} />;
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Regular Flat Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {lessons.map((lesson) => {
            const isCur = lesson.id === currentLessonId || lesson.lesson_number === currentLessonId;
            return <LessonCard key={lesson.id} lesson={lesson} isCurrent={isCur} />;
          })}
        </div>
      )}
    </div>
  );
};
