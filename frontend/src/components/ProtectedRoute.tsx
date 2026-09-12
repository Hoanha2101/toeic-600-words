import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserState } from '../hooks/useUserState';
import { LoadingScreen } from './LoadingScreen';

export const ProtectedRoute: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { userState, isLoading: stateLoading, isError, error, refetch } = useUserState();

  // 1. Auth check loading
  if (authLoading) {
    return <LoadingScreen message="Đang kiểm tra thông tin đăng nhập..." />;
  }

  // 2. Not logged in -> redirect to /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Logged in, loading user_state from server
  if (stateLoading) {
    return <LoadingScreen message="Đang tải dữ liệu và khôi phục tiến độ học..." />;
  }

  // 4. API Error: show explicit error screen with Retry, NEVER fallback quietly to empty state!
  if (isError || !userState) {
    return (
      <LoadingScreen
        message="Không thể kết nối đến máy chủ"
        error={error instanceof Error ? error.message : 'Lỗi nạp trạng thái học. Vui lòng kiểm tra kết nối mạng.'}
        onRetry={() => refetch()}
      />
    );
  }

  // 5. Ready to render protected child routes
  return <Outlet />;
};
