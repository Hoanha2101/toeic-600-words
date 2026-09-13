import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Clock,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TestResult } from '../types';
import { PronounceButton } from '../components/PronounceButton';
import { formatTime, cn } from '../lib/utils';

export const TestResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const result = (location.state as { result?: TestResult })?.result;

  React.useEffect(() => {
    if (result && result.score_percent >= 70) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [result]);

  if (!result) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Không tìm thấy kết quả bài thi</h2>
        <button
          onClick={() => navigate('/test')}
          className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold min-h-[44px]"
        >
          Quay lại trang luyện thi
        </button>
      </div>
    );
  }

  const { score_percent, correct_answers, total_questions, results, started_at, finished_at } = result;
  const wrongCount = total_questions - correct_answers;
  const isPassed = score_percent >= 70;

  // Calculate elapsed test duration
  let durationSeconds = 0;
  if (started_at && finished_at) {
    const s = new Date(started_at).getTime();
    const f = new Date(finished_at).getTime();
    if (f > s) {
      durationSeconds = Math.round((f - s) / 1000);
    }
  }

  // Circular progress calculation (r=42, circumference=263.89)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score_percent / 100) * circumference;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 sm:p-8 text-center space-y-6 transition-colors">
        {/* Visual Circular Progress Meter */}
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-slate-100 dark:text-slate-700"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Animated progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={cn(
                'transition-all duration-1000 ease-out',
                isPassed ? 'text-emerald-500' : 'text-amber-500'
              )}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {score_percent}%
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              {isPassed ? 'Đạt' : 'Cần ôn'}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isPassed ? '🎉 Chúc mừng bạn đã hoàn thành!' : '💪 Cố gắng thêm một chút nữa nhé!'}
          </h1>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Đúng {correct_answers} trên tổng số {total_questions} câu
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-1">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900">
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 block">{correct_answers}</span>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Câu đúng</span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900">
            <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 block">{wrongCount}</span>
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">Câu sai</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900">
            <span className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 block">
              {durationSeconds > 0 ? formatTime(durationSeconds) : '< 1p'}
            </span>
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">Thời gian</span>
          </div>
        </div>

        {/* Quick info alert */}
        {wrongCount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 text-xs font-medium text-left flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Lưu ý Spaced Repetition:</span> {wrongCount} từ bạn làm sai đã tự động được xếp vào diện cần ôn tập khẩn cấp. Lịch ôn tập đã được xếp lại gần hơn để bạn khắc sâu kiến thức!
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {wrongCount > 0 && (
            <Link
              to="/review"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center space-x-2 min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ôn ngay các từ đã sai ({wrongCount})</span>
            </Link>
          )}

          <Link
            to="/test"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition min-h-[44px] flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Làm bài test khác</span>
          </Link>

          <Link
            to="/roadmap"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2 min-h-[44px]"
          >
            <span>Về lộ trình học</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Detailed Answers Review with vocabulary definitions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Chi tiết từng câu hỏi ({results.length} câu)
          </h2>
          <span className="text-xs font-bold text-slate-400">
            Xem lại để khắc sâu kiến thức
          </span>
        </div>

        <div className="space-y-3">
          {results.map((ans, idx) => (
            <div
              key={idx}
              className={cn(
                'p-5 rounded-3xl border transition-all',
                ans.is_correct
                  ? 'bg-white dark:bg-slate-800 border-emerald-200/80 dark:border-emerald-900/60 shadow-sm'
                  : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-sm'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
                        ans.is_correct ? 'bg-emerald-500' : 'bg-rose-500'
                      )}
                    >
                      {ans.is_correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </span>
                    <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                      {ans.word}
                    </span>
                    {ans.part_of_speech && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                        {ans.part_of_speech}
                      </span>
                    )}
                    <PronounceButton
                      wordId={ans.word_id}
                      wordText={ans.word}
                      size="sm"
                    />
                  </div>

                  {/* Meaning & Definition */}
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <span>Nghĩa: </span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold">{ans.meaning_vi}</strong>
                    {ans.definition_en && (
                      <span className="text-slate-500 dark:text-slate-400 italic block sm:inline sm:ml-2">
                        — "{ans.definition_en}"
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex-shrink-0">
                  Câu {idx + 1}
                </span>
              </div>

              {/* Answers Comparison */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-slate-400 dark:text-slate-500 block mb-0.5 font-bold uppercase text-[10px]">
                    Câu trả lời của bạn:
                  </span>
                  <span className={cn('font-extrabold text-sm', ans.is_correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                    {ans.user_answer || '(Chưa trả lời)'}
                  </span>
                </div>
                {!ans.is_correct && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-emerald-600 dark:text-emerald-400 block mb-0.5 font-bold uppercase text-[10px]">
                      Đáp án đúng:
                    </span>
                    <span className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
                      {ans.correct_answer}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
