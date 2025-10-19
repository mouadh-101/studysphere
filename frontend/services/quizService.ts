import { apiClient } from './authService';
import type {
  Quiz,
  QuizQuestion,
  QuizAttempt,
  GenerateQuizData,
  SubmitAttemptData,
  QuizResponse,
  AttemptResponse,
} from './types/quiz';

/**
 * Quiz Service
 * Handles all quiz-related API calls
 */
export const quizService = {
  /**
   * Generate a new quiz from a document
   * @param data - Quiz generation data (file, numQuestions, difficulty)
   * @returns Promise with quiz response
   */
  generateQuiz: async (data: GenerateQuizData): Promise<QuizResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('numQuestions', data.numQuestions.toString());
      formData.append('difficulty', data.difficulty);

      const response = await apiClient.post<QuizResponse>(
        '/api/quiz/generate',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to generate quiz');
      }
      throw new Error('An unexpected error occurred during quiz generation');
    }
  },

  /**
   * Get all quizzes for the authenticated user
   * @returns Promise with quizzes list
   */
  getUserQuizzes: async (): Promise<QuizResponse> => {
    try {
      const response = await apiClient.get<QuizResponse>('/api/quiz/');

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch quizzes');
      }
      throw new Error('An unexpected error occurred while fetching quizzes');
    }
  },

  /**
   * Get a single quiz by ID (with questions)
   * @param quizId - Quiz ID
   * @returns Promise with quiz
   */
  getQuizById: async (quizId: string): Promise<QuizResponse> => {
    try {
      const response = await apiClient.get<QuizResponse>(
        `/api/quiz/${quizId}`
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch quiz');
      }
      throw new Error('An unexpected error occurred while fetching quiz');
    }
  },

  /**
   * Delete a quiz
   * @param quizId - Quiz ID
   * @returns Promise with success message
   */
  deleteQuiz: async (quizId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/api/quiz/${quizId}`
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to delete quiz');
      }
      throw new Error('An unexpected error occurred while deleting quiz');
    }
  },

  /**
   * Submit a quiz attempt
   * @param quizId - Quiz ID
   * @param data - Attempt data with answers
   * @returns Promise with attempt result and score
   */
  submitQuizAttempt: async (
    quizId: string,
    data: SubmitAttemptData
  ): Promise<AttemptResponse> => {
    try {
      const response = await apiClient.post<AttemptResponse>(
        `/api/quiz/${quizId}/attempt`,
        data
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to submit quiz attempt');
      }
      throw new Error('An unexpected error occurred while submitting quiz attempt');
    }
  },

  /**
   * Get all attempts for a specific quiz
   * @param quizId - Quiz ID
   * @returns Promise with attempts list
   */
  getQuizAttempts: async (quizId: string): Promise<AttemptResponse> => {
    try {
      const response = await apiClient.get<AttemptResponse>(
        `/api/quiz/${quizId}/attempts`
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch quiz attempts');
      }
      throw new Error('An unexpected error occurred while fetching quiz attempts');
    }
  },

  /**
   * Get a specific attempt by ID
   * @param attemptId - Attempt ID
   * @returns Promise with attempt details
   */
  getAttemptById: async (attemptId: string): Promise<AttemptResponse> => {
    try {
      const response = await apiClient.get<AttemptResponse>(
        `/api/quiz/attempt/${attemptId}`
      );

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch attempt');
      }
      throw new Error('An unexpected error occurred while fetching attempt');
    }
  },

  /**
   * Validate file before upload
   * @param file - File to validate
   * @returns Object with validation result
   */
  validateQuizFile: (file: File): { valid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 50MB limit',
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only PDF, Word, and text files are allowed',
      };
    }

    return { valid: true };
  },

  /**
   * Format file size for display
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Calculate percentage score
   * @param score - Number of correct answers
   * @param total - Total number of questions
   * @returns Percentage score
   */
  calculatePercentage: (score: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((score / total) * 100);
  },

  /**
   * Get score color based on percentage
   * @param percentage - Score percentage
   * @returns Color class/string
   */
  getScoreColor: (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  },

  /**
   * Get score label based on percentage
   * @param percentage - Score percentage
   * @returns Score label
   */
  getScoreLabel: (percentage: number): string => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Very Good';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Fair';
    return 'Need Improvement';
  },

  /**
   * Format date for display
   * @param dateString - ISO date string
   * @returns Formatted date string
   */
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};
