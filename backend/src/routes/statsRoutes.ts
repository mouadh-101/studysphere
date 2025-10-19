import express from 'express';
import * as statsController from '../controllers/statsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/user', authenticateToken, statsController.getUserStats);

export default router;
