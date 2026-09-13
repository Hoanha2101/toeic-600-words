import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Lesson } from '../types';
import { useAuth } from './useAuth';

export function useLessons() {
  const { user } = useAuth();

  return useQuery<Lesson[]>({
    queryKey: ['lessons', user?.id],
    queryFn: async () => {
      return apiClient.get<Lesson[]>('/api/lessons');
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useLessonDetail(lessonId?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<Lesson>({
    queryKey: ['lesson_detail', lessonId, user?.id],
    queryFn: async () => {
      if (!lessonId) throw new Error('Lesson ID required');
      return apiClient.get<Lesson>(`/api/lessons/${lessonId}/words`);
    },
    enabled: !!user && !!lessonId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const prefetchNextLesson = (nextLessonId: number) => {
    if (nextLessonId && user?.id) {
      queryClient.prefetchQuery({
        queryKey: ['lesson_detail', nextLessonId, user.id],
        queryFn: () => apiClient.get<Lesson>(`/api/lessons/${nextLessonId}/words`),
        staleTime: 1000 * 60 * 5,
      });
    }
  };

  return {
    ...query,
    prefetchNextLesson,
  };
}
