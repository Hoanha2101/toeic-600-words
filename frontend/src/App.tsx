import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';

import { LoginPage } from './pages/LoginPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { LessonLearnPage } from './pages/LessonLearnPage';
import { FlashcardPage } from './pages/FlashcardPage';
import { ReviewPage } from './pages/ReviewPage';
import { TestSetupPage } from './pages/TestSetupPage';
import { TestRunningPage } from './pages/TestRunningPage';
import { TestResultPage } from './pages/TestResultPage';
import { TestHistoryPage } from './pages/TestHistoryPage';
import { WordsBrowsePage } from './pages/WordsBrowsePage';
import { DashboardPage } from './pages/DashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
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
                <Route path="/words" element={<WordsBrowsePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="*" element={<Navigate to="/roadmap" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
