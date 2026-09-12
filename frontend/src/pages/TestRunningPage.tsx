import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send, HelpCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/api';
import { TestSession, TestResult } from '../types';
import { QuizQuestion } from '../components/QuizQuestion';
import { ProgressBar } from '../components/ProgressBar';

export const TestRunningPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const session = (location.state as { session?: TestSession })?.session;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!session || !session.questions || session.questions.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy phiên làm bài</h2>
        <p className="text-xs text-slate-500">
          Phiên làm bài có thể đã hết hạn hoặc không tồn tại. Vui lòng tạo bài test mới.
        </p>
        <button
          onClick={() => navigate('/test')}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Quay lại trang tạo bài test
        </button>
      </div>
    );
  }

  const questions = session.questions;
  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex];

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
    setErrorMsg('');

    try {
      const answersPayload = questions.map((q) => ({
        word_id: q.word_id,
        user_answer: answers[q.word_id] || '',
      }));

      const result = await apiClient.post<TestResult>(`/api/tests/${session.id}/submit`, {
        answers: answersPayload,
      });

      navigate(`/test/result/${session.id}`, { state: { result } });
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể nộp bài thi. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Bài kiểm tra đang diễn ra
          </span>
          <h2 className="text-lg font-extrabold text-slate-900">
            {session.test_type === 'mixed'
              ? 'Bài test tổng hợp'
              : `Dạng: ${session.test_type}`}
          </h2>
        </div>

        <button
          type="button"
          onClick={handleSubmitTest}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'Đang chấm điểm...' : 'Nộp bài'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-slate-500">
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
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                isCurrent
                  ? 'bg-slate-900 text-white ring-2 ring-emerald-500 ring-offset-2'
                  : isAnswered
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Question Card */}
      <QuizQuestion
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
          className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs transition disabled:opacity-30 flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Câu trước</span>
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center space-x-1"
          >
            <span>Câu tiếp theo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitTest}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài chấm điểm</span>
          </button>
        )}
      </div>
    </div>
  );
};
