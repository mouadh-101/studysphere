import { apiClient } from './authService';
import type {
  HomeworkProblem,
  SolutionStep,
  ProblemSolution,
  ProblemWithSolution,
  UploadResponse,
} from './types/homework';

// Re-export types for convenience
export type {
  HomeworkProblem,
  SolutionStep,
  ProblemSolution,
  ProblemWithSolution,
  UploadResponse,
};

/**
 * Upload a homework file (image or PDF)
 */
const uploadHomework = async (file: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<UploadResponse>('/api/homework/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || error.response.data?.error || 'Failed to upload homework');
    }
    throw new Error('Unexpected error while uploading homework');
  }
};

/**
 * Get all homework problems for the authenticated user
 */
const getUserHomework = async (): Promise<HomeworkProblem[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: HomeworkProblem[] }>('/api/homework/list');
    return response.data.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || error.response.data?.error || 'Failed to fetch homework');
    }
    throw new Error('Unexpected error while fetching homework');
  }
};

/**
 * Get a specific problem with its solution
 */
const getProblemSolution = async (problemId: string): Promise<ProblemWithSolution> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: ProblemWithSolution }>(
      `/api/homework/solved/${problemId}`
    );
    return response.data.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || error.response.data?.error || 'Failed to fetch solution');
    }
    throw new Error('Unexpected error while fetching solution');
  }
};

/**
 * Delete a homework problem
 */
const deleteHomework = async (problemId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/homework/${problemId}`);
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data?.message || error.response.data?.error || 'Failed to delete homework');
    }
    throw new Error('Unexpected error while deleting homework');
  }
};

/**
 * Poll for problem status updates (for async processing)
 */
const pollProblemStatus = async (
  problemId: string,
  onUpdate: (problem: ProblemWithSolution) => void,
  maxAttempts: number = 30,
  interval: number = 2000
): Promise<void> => {
  let attempts = 0;

  const poll = async () => {
    try {
      const data = await getProblemSolution(problemId);
      onUpdate(data);

      // Stop polling if solved or failed
      if (data.problem.status === 'solved' || data.problem.status === 'failed') {
        return;
      }

      // Continue polling if still pending
      if (attempts < maxAttempts && data.problem.status === 'pending') {
        attempts++;
        setTimeout(poll, interval);
      }
    } catch (error) {
      console.error('Poll error:', error);
    }
  };

  poll();
};

export const homeworkService = {
  uploadHomework,
  getUserHomework,
  getProblemSolution,
  deleteHomework,
  pollProblemStatus,
};

export default homeworkService;
