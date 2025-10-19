import { Router } from 'express';
import { 
  generateQuiz, 
  getUserQuizzes, 
  getQuizById, 
  deleteQuiz, 
  submitQuizAttempt, 
  getQuizAttempts, 
  getAttemptById 
} from '../controllers/quizController';
import { upload } from '../utils/fileUpload';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Generate quiz from document
router.post('/generate', authenticateToken, upload.single('file'), generateQuiz);

// Get all quizzes for authenticated user
router.get('/', authenticateToken, getUserQuizzes);

// Get a specific quiz by ID (with questions)
router.get('/:id', authenticateToken, getQuizById);

// Delete a quiz
router.delete('/:id', authenticateToken, deleteQuiz);

// Submit quiz attempt
router.post('/:id/attempt', authenticateToken, submitQuizAttempt);

// Get all attempts for a quiz
router.get('/:id/attempts', authenticateToken, getQuizAttempts);

// Get a specific attempt by ID
router.get('/attempt/:attemptId', authenticateToken, getAttemptById);

export default router;
