import { Router } from 'express';
import {
  uploadPaper,
  getPaperById,
  getUserPapers,
  deletePaper,
  getRelatedPapers,
} from '../controllers/researchController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../utils/fileUpload';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Upload research paper
router.post('/upload', upload.single('file'), uploadPaper);

// Get all user papers
router.get('/list', getUserPapers);

// Get related papers from Semantic Scholar
router.get('/:paperId/related', getRelatedPapers);

// Get single paper by ID (must be after /list and /:paperId/related to avoid conflicts)
router.get('/:paperId', getPaperById);

// Delete paper
router.delete('/:paperId', deletePaper);

export default router;
