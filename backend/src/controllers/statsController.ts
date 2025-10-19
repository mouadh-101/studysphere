import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as statsService from '../services/statsService';

export const getUserStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const stats = await statsService.getUserStats(userId);

    res.status(200).json(stats);
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};
