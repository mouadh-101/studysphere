// Language Assistant types

export type TargetLanguage = 'english' | 'french' | 'spanish';

export interface GrammarErrorItem {
  errorType: string;
  sentence: string;
  replacement?: string;
  position?: { start: number; end: number };
  description?: string;
}

export interface GrammarFeedback {
  totalErrors: number;
  errors: GrammarErrorItem[];
}

export interface UnifiedResponse {
  success: boolean;
  data?: {
    aiResponse?: string;
    grammarFeedback?: GrammarFeedback;
    sessionId: string;
    messageId: string;
    transcription?: string;
  };
  error?: string;
  message?: string;
}

export interface ConversationSession {
  session_id: string;
  user_id: string;
  target_language: TargetLanguage;
  conversation_topic?: string | null;
  total_messages: number;
  created_at: string;
  updated_at: string;
  messages?: SessionMessage[];
}

export interface SessionMessage {
  message_id: string;
  session_id: string;
  message_type: 'user' | 'ai';
  content?: string | null;
  audio_url?: string | null;
  transcription?: string | null;
  message_order: number;
  created_at: string;
  processed: boolean;
}

export interface StartSessionPayload {
  target_language: TargetLanguage;
  conversation_topic?: string;
}

export interface StartSessionResponse {
  success: boolean;
  data: { sessionId: string };
  message?: string;
}

export interface SendTextPayload {
  session_id: string;
  text: string;
}

export interface ListSessionsResponse {
  success: boolean;
  data: ConversationSession[];
  message?: string;
}
