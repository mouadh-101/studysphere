import { Request, Response } from 'express';
import LanguageService from '../services/languageService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import path from 'path';

export const startSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const { target_language, conversation_topic } = req.body as { target_language: 'english'|'french'|'spanish'; conversation_topic?: string };

    if (!target_language) {
      return res.status(400).json({ success: false, message: 'target_language is required' });
    }

    const session = await LanguageService.startSession(userId, target_language, conversation_topic);
    res.json({ success: true, data: { sessionId: session.session_id } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to start session' });
  }
};

export const sendText = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const { session_id, text } = req.body as { session_id: string; text: string };

    if (!session_id || !text) {
      return res.status(400).json({ success: false, message: 'session_id and text are required' });
    }

    const response = await LanguageService.processTextMessage({ userId, sessionId: session_id, text });
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to process text message' });
  }
};

export default { startSession, sendText };
