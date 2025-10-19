import ConversationSession from '../models/ConversationSession';
import SessionMessage from '../models/SessionMessage';
import { InferenceClient } from "@huggingface/inference";
// Voice logic removed per request

let hfClient: InferenceClient | null = null;
// let AssemblyAI: any; // removed
let SaplingClient: any;

export interface GrammarFeedback {
  totalErrors: number;
  errors: Array<{
    errorType: string;
    sentence: string;
    replacement?: string;
    position?: { start: number; end: number };
    description?: string;
  }>;
}

export interface UnifiedResponse {
  success: boolean;
  data?: {
    aiResponse?: string;
    grammarFeedback?: GrammarFeedback;
    sessionId: string;
    messageId: string;
  };
  error?: string;
}

export const LanguageService = {
  async getUserSessionsWithMessages(userId: string) {
    const sessions = await ConversationSession.findAll({
      where: { user_id: userId },
      order: [["updated_at", "DESC"]],
      include: [
        {
          model: require('../models/SessionMessage').default,
          as: 'messages',
          separate: true,
          order: [["message_order", "ASC"]],
        },
      ],
    });
    return sessions;
  },
  async startSession(
    userId: string,
    target_language: 'english' | 'french' | 'spanish',
    conversation_topic?: string
  ): Promise<ConversationSession> {
    const session = await ConversationSession.create({
      user_id: userId,
      target_language,
      conversation_topic: conversation_topic || null,
      total_messages: 0,
    });
    return session;
  },

  async processTextMessage(params: { userId: string; sessionId: string; text: string }): Promise<UnifiedResponse> {
    const { userId, sessionId, text } = params;
    const session = await ConversationSession.findOne({ where: { session_id: sessionId, user_id: userId } });
    if (!session) return { success: false, error: 'Session not found' };

    const lastMsg = await SessionMessage.findOne({ where: { session_id: sessionId }, order: [['message_order', 'DESC']] });
    const nextOrder = lastMsg ? lastMsg.message_order + 1 : 1;

    await SessionMessage.create({ session_id: sessionId, message_type: 'user', content: text, message_order: nextOrder, processed: false });

    let grammarFeedback: GrammarFeedback | undefined;
    try {
      if (!SaplingClient) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Client } = require('@saplingai/sapling-js/client');
        SaplingClient = new Client(process.env.SAPLING_API_KEY);
      }
      const resp = await SaplingClient.edits(text);
      const data = (resp && typeof resp === 'object' && 'data' in resp) ? (resp as any).data : (resp?.json ? await resp.json() : resp);
      const errors = Array.isArray(data?.edits)
        ? data.edits.map((e: any) => ({
          errorType: e.category || 'Grammar',
          sentence: e.sentence || text,
          replacement: e.replacement,
          position: e.position,
          description: e.explanation || e.description,
        }))
        : [];
      grammarFeedback = { totalErrors: errors.length, errors };
    } catch (e: any) {
      grammarFeedback = undefined;
    }

    const history = await SessionMessage.findAll({ where: { session_id: sessionId }, order: [['message_order', 'ASC']], limit: 50 });
    
    // Build messages array for chat completion API
    const messages = [
      { role: 'system', content: `Act as a ${session.target_language} language tutor. Always reformulate the student's phrases to be better and fix mistakes.` },
      ...history.map((m) => ({ 
        role: m.message_type === 'user' ? 'user' : 'assistant', 
        content: String(m.content ?? '') 
      })),
    ];

    let aiText: string | undefined;
    try {
      if (!hfClient) {
        hfClient = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
      }

      const chatCompletion = await hfClient.chatCompletion({
        provider: "auto",
        model: "openai/gpt-oss-120b",
        messages: messages,
        max_tokens: 250,
        temperature: 0.7,
        top_p: 0.9,
      });
      
      aiText = chatCompletion.choices[0]?.message?.content?.trim();
      console.log('HuggingFace response:', chatCompletion.choices[0]?.message);
    } catch (error: any) {
      console.error('HuggingFace error:', error);
      aiText = undefined;
    }

    const aiOrder = nextOrder + 1;
    const aiMsg = await SessionMessage.create({ session_id: sessionId, message_type: 'ai', content: aiText || 'Sorry, I had trouble responding right now.', message_order: aiOrder, processed: true });
    await session.update({ total_messages: aiOrder, updated_at: new Date() });

    return { success: true, data: { aiResponse: aiMsg.content || undefined, grammarFeedback, sessionId, messageId: aiMsg.message_id } };
  },

};

export default LanguageService;
