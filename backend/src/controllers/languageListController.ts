import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import LanguageService from '../services/languageService';

export const listUserSessions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const sessions = await LanguageService.getUserSessionsWithMessages(userId);
    return res.json({ success: true, data: sessions });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || 'Failed to fetch sessions' });
  }
};

export default { listUserSessions };
