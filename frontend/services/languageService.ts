import { apiClient } from './authService';
import type {
  UnifiedResponse,
  StartSessionPayload,
  StartSessionResponse,
  SendTextPayload,
  ListSessionsResponse,
} from './types/language';

export const languageService = {
  // Start a new conversation session
  startSession: async (payload: StartSessionPayload): Promise<StartSessionResponse> => {
    try {
      const res = await apiClient.post<StartSessionResponse>('/api/language/session', payload);
      return res.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || error.response.data?.error || 'Failed to start session');
      }
      throw new Error('Unexpected error while starting session');
    }
  },

  // Send a text message within a session
  sendTextMessage: async (payload: SendTextPayload): Promise<UnifiedResponse> => {
    try {
      const res = await apiClient.post<UnifiedResponse>('/api/language/message', payload);
      return res.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || error.response.data?.error || 'Failed to send message');
      }
      throw new Error('Unexpected error while sending message');
    }
  },

  // List all sessions with their messages
  getUserSessionsWithMessages: async (): Promise<ListSessionsResponse> => {
    try {
      const res = await apiClient.get<ListSessionsResponse>('/api/language/sessions');
      return res.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data?.message || error.response.data?.error || 'Failed to fetch sessions');
      }
      throw new Error('Unexpected error while fetching sessions');
    }
  },
};

export default languageService;
