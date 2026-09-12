import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Sm2Rating } from '../types';
import { useAuth } from './useAuth';

export function useWordProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const markKnownMutation = useMutation({
    mutationFn: async ({ wordId, isMarkedKnown }: { wordId: number; isMarkedKnown: boolean }) => {
      return apiClient.post(`/api/progress/word/${wordId}/mark`, { is_marked_known: isMarkedKnown });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_state', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['lessons', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['lesson_detail'] });
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['review_due'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const reviewWordMutation = useMutation({
    mutationFn: async ({ wordId, rating }: { wordId: number; rating: Sm2Rating }) => {
      return apiClient.post(`/api/progress/word/${wordId}/review`, { rating });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_state', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['lessons', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['lesson_detail'] });
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['review_due'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const batchMarkMutation = useMutation({
    mutationFn: async ({ wordIds, isMarkedKnown }: { wordIds: number[]; isMarkedKnown: boolean }) => {
      return apiClient.post('/api/progress/batch-mark', { word_ids: wordIds, is_marked_known: isMarkedKnown });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_state', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['lessons', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['lesson_detail'] });
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['review_due'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    markKnown: markKnownMutation.mutate,
    markKnownAsync: markKnownMutation.mutateAsync,
    isMarking: markKnownMutation.isPending,
    reviewWord: reviewWordMutation.mutate,
    reviewWordAsync: reviewWordMutation.mutateAsync,
    isReviewing: reviewWordMutation.isPending,
    batchMark: batchMarkMutation.mutate,
    batchMarkAsync: batchMarkMutation.mutateAsync,
    isBatchMarking: batchMarkMutation.isPending,
  };
}
