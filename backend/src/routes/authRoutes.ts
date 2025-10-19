import { Router } from 'express';
import AuthController from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
const router = Router();

router.post('/register', AuthController.register);
router.post('/login',  AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);

export default router;