import { Router } from 'express';
import multer from 'multer';
import { uploadNoteAudio, getNoteSummary, listUserNotes, deleteNote } from '../controllers/noteSummarizerController';
import { authenticateToken } from '../middleware/authMiddleware';

const upload = multer({ dest: 'uploads/' });
const router = Router();

// Upload and process audio note
router.post('/upload', authenticateToken, upload.single('audio'), uploadNoteAudio);

// Get all note summaries for user
router.get('/list', authenticateToken, listUserNotes);

// Get note summary by ID
router.get('/:id', authenticateToken, getNoteSummary);

// Delete note summary
router.delete('/:id', authenticateToken, deleteNote);

export default router;
