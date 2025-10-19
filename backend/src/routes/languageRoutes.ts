import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../utils/fileUpload';
import languageController from '../controllers/languageController';
import languageListController from '../controllers/languageListController';

const router = Router();

// Start a new conversation session
router.post('/session', authenticateToken, languageController.startSession);

// Send a text message
router.post('/message', authenticateToken, languageController.sendText);

// Voice endpoint removed per request

// List all sessions with messages
router.get('/sessions', authenticateToken, languageListController.listUserSessions);

export default router;
