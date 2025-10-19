import { Router } from 'express';
import { uploadHomework, getProblemSolution, getUserHomework, deleteHomework } from '../controllers/homeworkController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../utils/fileUpload';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Upload homework file
router.post('/upload', upload.single('file'), uploadHomework);

// Get all homework for authenticated user
router.get('/list', getUserHomework);

// Get solution for a specific problem
router.get('/solved/:problemId', getProblemSolution);

// Delete a homework problem
router.delete('/:problemId', deleteHomework);

export default router;
