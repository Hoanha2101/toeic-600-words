import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, BookOpen, AlertCircle, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { signIn, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // If already logged in, redirect to roadmap
  React.useEffect(() => {
    if (user) {
      navigate('/roadmap', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setErrorMsg(error.message || 'Email hoặc mật khẩu không chính xác.');
      } else {
        navigate('/roadmap');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi đăng nhập.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập email để nhận liên kết đổi mật khẩu.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const { error } = await resetPassword(email.trim());
      if (error) {
        setErrorMsg(error.message);
      } else {
        setResetSent(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/20 text-white">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
          600 Essential Words
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Chinh phục 600 từ vựng TOEIC với thuật toán Spaced Repetition
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-700/80 rounded-3xl sm:px-10">
          {errorMsg && (
            <div className="mb-5 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resetSent ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <p className="text-slate-200 text-sm font-medium">
                Email đặt lại mật khẩu đã được gửi đến <strong className="text-white">{email}</strong>. Vui lòng kiểm tra hộp thư.
              </p>
              <button
                type="button"
                onClick={() => {
                  setResetSent(false);
                  setShowReset(false);
                }}
                className="text-xs font-semibold text-emerald-400 hover:underline"
              >
                Quay lại đăng nhập
              </button>
            </div>
          ) : showReset ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Quên mật khẩu</h3>
              <p className="text-xs text-slate-400">
                Nhập địa chỉ email tài khoản của bạn để nhận liên kết đặt lại mật khẩu từ Supabase.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-700/50 transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleResetPassword}
                  className="w-1/2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi link reset'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400">
              Tài khoản được tạo thủ công qua Supabase Auth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
