import { Request, Response } from 'express';
import { noteSummarizerService } from '../services/noteSummarizerService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

/**
 * POST /api/notes/upload
 * Upload audio file, process, and return structured summary
 */
export async function uploadNoteAudio(req: AuthenticatedRequest, res: Response) {
  try {
    const filePath = req.file?.path;
    if (!filePath) return res.status(400).json({ error: 'No audio file uploaded' });
    
    if (!req.user?.user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.user_id;
    // Process audio and save to DB
    const result = await noteSummarizerService.processNoteAudio(filePath, userId);
    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Note upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process note' });
  }
}

/**
 * GET /api/notes/:id
 * Get processed note summary and mindmap
 */
export async function getNoteSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await noteSummarizerService.getNoteSummaryById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Note summary not found' });
    return res.json(result);
  } catch (error: any) {
    console.error('Get note summary error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch note summary' });
  }
}

/**
 * GET /api/notes/list
 * List all processed notes for user
 */
export async function listUserNotes(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.user_id;
    const summaries = await noteSummarizerService.getUserNoteSummaries(userId);
    return res.json(summaries);
  } catch (error: any) {
    console.error('List notes error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list notes' });
  }
}

/**
 * DELETE /api/notes/:id
 * Delete note summary and mindmap
 */
export async function deleteNote(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user?.user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.user_id;
    const success = await noteSummarizerService.deleteNote(req.params.id, userId);
    if (!success) return res.status(404).json({ error: 'Note summary not found or unauthorized' });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Delete note error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete note' });
  }
}
