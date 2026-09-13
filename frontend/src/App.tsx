import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { LoadingScreen } from './components/LoadingScreen';

// Lazy-loaded pages for mobile bundle optimization (code-splitting)
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage').then(m => ({ default: m.RoadmapPage })));
const LessonLearnPage = lazy(() => import('./pages/LessonLearnPage').then(m => ({ default: m.LessonLearnPage })));
const FlashcardPage = lazy(() => import('./pages/FlashcardPage').then(m => ({ default: m.FlashcardPage })));
const ReviewPage = lazy(() => import('./pages/ReviewPage').then(m => ({ default: m.ReviewPage })));
const TestSetupPage = lazy(() => import('./pages/TestSetupPage').then(m => ({ default: m.TestSetupPage })));
const TestRunningPage = lazy(() => import('./pages/TestRunningPage').then(m => ({ default: m.TestRunningPage })));
const TestResultPage = lazy(() => import('./pages/TestResultPage').then(m => ({ default: m.TestResultPage })));
const TestHistoryPage = lazy(() => import('./pages/TestHistoryPage').then(m => ({ default: m.TestHistoryPage })));
const WordsBrowsePage = lazy(() => import('./pages/WordsBrowsePage').then(m => ({ default: m.WordsBrowsePage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2,
    },
  },
});

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-12">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen message="Đang tải dữ liệu..." />}>
              <Routes>
                {/* Public route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Navigate to="/roadmap" replace />} />
                    <Route path="/roadmap" element={<RoadmapPage />} />
                    <Route path="/lesson/:id/learn" element={<LessonLearnPage />} />
                    <Route path="/lesson/:id/flashcard" element={<FlashcardPage />} />
                    <Route path="/review" element={<ReviewPage />} />
                    <Route path="/test" element={<TestSetupPage />} />
                    <Route path="/test/:sessionId" element={<TestRunningPage />} />
                    <Route path="/test/result/:sessionId" element={<TestResultPage />} />
                    <Route path="/test/history" element={<TestHistoryPage />} />
                    <Route path="/leaderboard" element={<LeaderboardPage />} />
                    <Route path="/words" element={<WordsBrowsePage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="*" element={<Navigate to="/roadmap" replace />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
