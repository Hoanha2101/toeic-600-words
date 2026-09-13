import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  Check,
  HelpCircle,
  Volume2,
  Sparkles,
  Eye,
  EyeOff,
  X,
  Play,
} from 'lucide-react';
import { apiClient, ApiError } from '../lib/api';
import { TestSession, TestResult } from '../types';
import { QuizQuestion } from '../components/QuizQuestion';
import { ProgressBar } from '../components/ProgressBar';
import { ErrorBanner } from '../components/ErrorBanner';
import { preloadAudio, playPronunciation } from '../lib/audio';
import { cn } from '../lib/utils';

export const TestRunningPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const session = (location.state as { session?: TestSession })?.session;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ message: string; isNetwork: boolean } | null>(null);

  // Settings toggles
  const [showHints, setShowHints] = useState(true);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);

  // Unanswered modal confirmation
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  if (!session || !session.questions || session.questions.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Không tìm thấy phiên làm bài</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Phiên làm bài có thể đã hết hạn hoặc không tồn tại. Vui lòng tạo bài test mới.
        </p>
        <button
          onClick={() => navigate('/test')}
          className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold min-h-[44px]"
        >
          Quay lại trang tạo bài test
        </button>
      </div>
    );
  }

  const questions = session.questions;
  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex];

  // Preload audio for next question if listening
  useEffect(() => {
    const nextQ = questions[currentIndex + 1];
    if (nextQ && nextQ.audio_word) {
      preloadAudio(nextQ.audio_word_id || nextQ.word_id, nextQ.audio_word, nextQ.audio_url);
    }
  }, [currentIndex, questions]);

  // Autoplay audio on question change if enabled
  useEffect(() => {
    if (autoPlayAudio && currentQ.question_type === 'listening' && currentQ.audio_word) {
      const timer = setTimeout(() => {
        playPronunciation(
          currentQ.audio_word_id || currentQ.word_id,
          currentQ.audio_word || '',
          currentQ.audio_url
        ).catch(() => {});
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoPlayAudio, currentQ]);

  const handleSelectAnswer = useCallback((ans: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.word_id]: ans,
    }));
  }, [currentQ.word_id]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in fill_blank input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Replay audio with Space or L
      if ((e.code === 'Space' || e.key.toLowerCase() === 'l') && currentQ.question_type === 'listening') {
        e.preventDefault();
        playPronunciation(
          currentQ.audio_word_id || currentQ.word_id,
          currentQ.audio_word || '',
          currentQ.audio_url
        ).catch(() => {});
        return;
      }

      // Arrow navigation
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < totalQuestions - 1) setCurrentIndex((prev) => prev + 1);
        return;
      }

      // 1, 2, 3, 4 or A, B, C, D to pick option
      if (currentQ.options && currentQ.options.length > 0) {
        let optIndex = -1;
        if (['1', '2', '3', '4'].includes(e.key)) {
          optIndex = parseInt(e.key, 10) - 1;
        } else {
          const k = e.key.toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(k)) {
            optIndex = k.charCodeAt(0) - 65;
          }
        }

        if (optIndex >= 0 && optIndex < currentQ.options.length) {
          e.preventDefault();
          const chosen = currentQ.options[optIndex];
          handleSelectAnswer(chosen);
        }
      }

      // Enter to advance if current is answered
      if (e.key === 'Enter') {
        if (currentIndex < totalQuestions - 1 && answers[currentQ.word_id]) {
          e.preventDefault();
          setCurrentIndex((prev) => prev + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQ, totalQuestions, answers, handleSelectAnswer]);

  const answeredCount = Object.keys(answers).filter((wid) => answers[parseInt(wid, 10)]?.trim() !== '').length;

  // Find unanswered questions
  const unansweredIndices = questions
    .map((q, idx) => (answers[q.word_id]?.trim() ? -1 : idx + 1))
    .filter((num) => num > 0);

  const executeSubmit = async () => {
    setConfirmModalOpen(false);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const answersPayload = questions.map((q) => ({
        word_id: q.word_id,
        user_answer: answers[q.word_id] || '',
        question_type: q.question_type,
      }));

      const result = await apiClient.post<TestResult>(`/api/tests/${session.id}/submit`, {
        answers: answersPayload,
      });

      navigate(`/test/result/${session.id}`, { state: { result } });
    } catch (err: any) {
      const isNetwork = err instanceof ApiError ? err.isNetworkError : !navigator.onLine;
      const errorText =
        err?.message ||
        (isNetwork
          ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra WiFi/4G và bấm Thử lại.'
          : 'Hệ thống gặp sự cố khi chấm điểm. Vui lòng bấm Thử lại.');

      setSubmitError({
        message: errorText,
        isNetwork,
      });
      setIsSubmitting(false);
    }
  };

  const handlePromptSubmit = () => {
    if (answeredCount < totalQuestions) {
      setConfirmModalOpen(true);
      return;
    }
    executeSubmit();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Bài kiểm tra đang diễn ra
          </span>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {session.test_type === 'mixed'
              ? 'Bài test tổng hợp'
              : session.test_type === 'listening'
              ? 'Luyện nghe (Listening)'
              : `Dạng: ${session.test_type}`}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {/* Toggle show definitions hint */}
          <button
            type="button"
            onClick={() => setShowHints(!showHints)}
            className={cn(
              'flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition min-h-[40px] border',
              showHints
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-transparent'
            )}
            title="Bật/Tắt chú thích nghĩa từ khi rê chuột"
          >
            {showHints ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Chú thích nghĩa</span>
          </button>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handlePromptSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5 disabled:opacity-50 min-h-[40px]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Đang chấm điểm...' : 'Nộp bài'}</span>
          </button>
        </div>
      </div>

      {/* Error State Banner with Retry (Preserves all answers) */}
      {submitError && (
        <ErrorBanner
          title={submitError.isNetwork ? 'Mất kết nối máy chủ' : 'Chưa thể nộp bài'}
          message={submitError.message}
          onRetry={executeSubmit}
          isRetrying={isSubmitting}
          isNetworkError={submitError.isNetwork}
        />
      )}

      {/* Progress & Stat */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-extrabold text-slate-500 dark:text-slate-400">
          <span>Câu {currentIndex + 1} / {totalQuestions}</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            Đã làm {answeredCount} / {totalQuestions} câu
          </span>
        </div>
        <ProgressBar value={answeredCount} max={totalQuestions} size="sm" />
      </div>

      {/* Question palette (Numbers 1-10 with 3 distinct visual states) */}
      <div className="bg-white dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex overflow-x-auto no-scrollbar items-center justify-between sm:justify-center gap-1.5 sm:gap-2">
          {questions.map((q, idx) => {
            const hasAnswer = Boolean(answers[q.word_id]?.trim());
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.question_index}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  'w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs font-black transition-all flex items-center justify-center flex-shrink-0 relative',
                  isCurrent
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-2 ring-emerald-500 ring-offset-2 scale-105 shadow-md z-10'
                    : hasAnswer
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                )}
                title={`Câu ${idx + 1}: ${hasAnswer ? 'Đã làm' : 'Chưa làm'}`}
              >
                <span>{idx + 1}</span>
                {hasAnswer && !isCurrent && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Card with definition tooltips/popovers */}
      <div className="relative">
        <QuizQuestion
          key={`question-${currentQ.question_index}-${currentQ.word_id}`}
          question={currentQ}
          selectedAnswer={answers[currentQ.word_id] || ''}
          onSelectAnswer={handleSelectAnswer}
          showHints={showHints}
          autoPlayAudio={autoPlayAudio}
        />
      </div>

      {/* Keyboard shortcuts hint bar (Desktop only) */}
      <div className="hidden sm:flex items-center justify-center space-x-4 text-xs font-medium text-slate-400 dark:text-slate-500 py-1">
        <span>Phím <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">1-4</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">A-D</kbd>: Chọn đáp án</span>
        <span>•</span>
        <span><kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">Space / L</kbd>: Nghe lại</span>
        <span>•</span>
        <span><kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">← →</kbd>: Chuyển câu</span>
      </div>

      {/* Navigation & Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => prev - 1)}
          className="px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs transition disabled:opacity-30 flex items-center space-x-1 min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Câu trước</span>
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            className="px-6 py-3 rounded-2xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center space-x-1 min-h-[44px]"
          >
            <span>Câu tiếp theo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePromptSubmit}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-1 min-h-[44px]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài chấm điểm</span>
          </button>
        )}
      </div>

      {/* Unanswered Warning Modal Dialog */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Bạn còn {unansweredIndices.length} câu chưa trả lời!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Các câu chưa làm sẽ bị tính là 0 điểm. Nhấp vào số câu bên dưới để làm nốt:
              </p>

              {/* Unanswered question pills */}
              <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                {unansweredIndices.map((qNum) => (
                  <button
                    key={qNum}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(qNum - 1);
                      setConfirmModalOpen(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                  >
                    Câu {qNum}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (unansweredIndices.length > 0) {
                    setCurrentIndex(unansweredIndices[0] - 1);
                  }
                  setConfirmModalOpen(false);
                }}
                className="w-full sm:w-1/2 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition min-h-[44px]"
              >
                Làm tiếp câu còn thiếu
              </button>
              <button
                type="button"
                onClick={executeSubmit}
                className="w-full sm:w-1/2 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition min-h-[44px]"
              >
                Vẫn nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
