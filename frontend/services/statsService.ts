import { apiClient } from './index';

export interface UserStats {
  notes: {
    total: number;
    completed: number;
    thisWeek: number;
  };
  research: {
    total: number;
    completed: number;
    thisWeek: number;
  };
  quizzes: {
    total: number;
    averageScore: number;
    thisWeek: number;
  };
  homework: {
    total: number;
    solved: number;
    thisWeek: number;
  };
}

export const statsService = {
  getUserStats: async (): Promise<UserStats> => {
    const response = await apiClient.get('/api/stats/user');
    return response.data;
  },
};
