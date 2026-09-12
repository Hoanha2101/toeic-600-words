import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { UserStateResponse } from '../types';
import { useAuth } from './useAuth';

export function useUserState() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<UserStateResponse>({
    queryKey: ['user_state', user?.id],
    queryFn: async () => {
      return apiClient.get<UserStateResponse>('/api/me/state');
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
  });

  const updateStateMutation = useMutation({
    mutationFn: async (params: {
      current_lesson_id?: number;
      current_word_index?: number;
      current_mode?: string;
      add_study_seconds?: number;
    }) => {
      return apiClient.put<UserStateResponse>('/api/me/state', params);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user_state', user?.id], data);
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    ...query,
    userState: query.data,
    updateState: updateStateMutation.mutate,
    updateStateAsync: updateStateMutation.mutateAsync,
  };
}
