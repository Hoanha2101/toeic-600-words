import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send, AlertCircle } from 'lucide-react';
import { apiClient, ApiError } from '../lib/api';
import { TestSession, TestResult } from '../types';
import { QuizQuestion } from '../components/QuizQuestion';
import { ProgressBar } from '../components/ProgressBar';
import { ErrorBanner } from '../components/ErrorBanner';
import { preloadAudio } from '../lib/audio';

export const TestRunningPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const session = (location.state as { session?: TestSession })?.session;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ message: string; isNetwork: boolean } | null>(null);

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

  const handleSelectAnswer = (ans: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.word_id]: ans,
    }));
  };

  const answeredCount = Object.keys(answers).length;

  const handleSubmitTest = async () => {
    if (answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm(
        `Bạn mới làm ${answeredCount}/${totalQuestions} câu. Bạn có chắc chắn muốn nộp bài sớm không?`
      );
      if (!confirmSubmit) return;
    }

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Bài kiểm tra đang diễn ra
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {session.test_type === 'mixed'
              ? 'Bài test tổng hợp'
              : `Dạng: ${session.test_type}`}
          </h2>
        </div>

        <button
          type="button"
          onClick={handleSubmitTest}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5 disabled:opacity-50 min-h-[44px]"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'Đang chấm điểm...' : 'Nộp bài'}</span>
        </button>
      </div>

      {/* Error State Banner with Retry */}
      {submitError && (
        <ErrorBanner
          title={submitError.isNetwork ? 'Mất kết nối máy chủ' : 'Chưa thể nộp bài'}
          message={submitError.message}
          onRetry={handleSubmitTest}
          isRetrying={isSubmitting}
          isNetworkError={submitError.isNetwork}
        />
      )}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>Câu {currentIndex + 1} / {totalQuestions}</span>
          <span>Đã làm: {answeredCount}/{totalQuestions} câu</span>
        </div>
        <ProgressBar value={answeredCount} max={totalQuestions} size="sm" />
      </div>

      {/* Question palette (Dots) */}
      <div className="flex flex-wrap gap-1.5 justify-center py-2">
        {questions.map((q, idx) => {
          const isAnswered = answers[q.word_id] !== undefined && answers[q.word_id] !== '';
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.question_index}
              onClick={() => setCurrentIndex(idx)}
              className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                isCurrent
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-2 ring-emerald-500 ring-offset-2'
                  : isAnswered
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Question Card (With distinct key to prevent stale state) */}
      <QuizQuestion
        key={`question-${currentQ.question_index}-${currentQ.word_id}`}
        question={currentQ}
        selectedAnswer={answers[currentQ.word_id] || ''}
        onSelectAnswer={handleSelectAnswer}
      />

      {/* Navigation Buttons */}
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
            onClick={handleSubmitTest}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-1 min-h-[44px]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài chấm điểm</span>
          </button>
        )}
      </div>
    </div>
  );
};
