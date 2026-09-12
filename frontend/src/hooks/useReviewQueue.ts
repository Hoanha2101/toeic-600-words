import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Word } from '../types';
import { useAuth } from './useAuth';

export function useReviewQueue() {
  const { user } = useAuth();

  return useQuery<Word[]>({
    queryKey: ['review_due', user?.id],
    queryFn: async () => {
      return apiClient.get<Word[]>('/api/review/due');
    },
    enabled: !!user,
    staleTime: 1000 * 30, // 30 seconds
  });
}
