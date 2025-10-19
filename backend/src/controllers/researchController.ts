import { Request, Response } from 'express';
import ResearchPaper from '../models/ResearchPaper';
import PaperSummary from '../models/PaperSummary';
import PaperCitation from '../models/PaperCitation';
import ResearchQuestion from '../models/ResearchQuestion';
import { researchService } from '../services/researchService';

interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
  };
}

/**
 * Upload and process research paper
 */
export const uploadPaper = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    if (!req.user?.user_id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { title } = req.body;

    if (!title) {
      res.status(400).json({
        success: false,
        message: 'Title is required',
      });
      return;
    }

    // Create paper record
    const paper = await ResearchPaper.create({
      user_id: req.user.user_id,
      title,
      file_path: req.file.path,
      status: 'pending',
    });

    // Process paper asynchronously
    researchService.processPaper(paper.paper_id).catch(error => {
      console.error('Background processing error:', error);
    });

    res.status(201).json({
      success: true,
      message: 'Paper uploaded successfully. Processing has started.',
      paper: {
        paper_id: paper.paper_id,
        title: paper.title,
        status: paper.status,
        created_at: paper.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error uploading paper:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload paper',
    });
  }
};

/**
 * Get paper by ID with all analysis data
 */
export const getPaperById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { paperId } = req.params;

    const paper = await ResearchPaper.findByPk(paperId, {
      include: [
        { model: PaperSummary, as: 'summary' },
        { model: PaperCitation, as: 'citations' },
        { model: ResearchQuestion, as: 'research_questions' },
      ],
    });

    if (!paper) {
      res.status(404).json({
        success: false,
        message: 'Paper not found',
      });
      return;
    }

    // Verify ownership
    if (paper.user_id !== req.user?.user_id) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized to access this paper',
      });
      return;
    }

    res.json({
      success: true,
      paper,
    });
  } catch (error: any) {
    console.error('Error fetching paper:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch paper',
    });
  }
};

/**
 * Get all papers for authenticated user
 */
export const getUserPapers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.user_id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const papers = await ResearchPaper.findAll({
      where: { user_id: req.user.user_id },
      order: [['created_at', 'DESC']],
      include: [
        { model: PaperSummary, as: 'summary' },
      ],
    });

    res.json({
      success: true,
      papers,
    });
  } catch (error: any) {
    console.error('Error fetching user papers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch papers',
    });
  }
};

/**
 * Delete paper
 */
export const deletePaper = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { paperId } = req.params;

    if (!req.user?.user_id) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    await researchService.deletePaper(paperId, req.user.user_id);

    res.json({
      success: true,
      message: 'Paper deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting paper:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete paper',
    });
  }
};

/**
 * Get related papers from Semantic Scholar (not saved to database)
 */
export const getRelatedPapers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { paperId } = req.params;
    const { limit } = req.query;

    const paper = await ResearchPaper.findByPk(paperId);

    if (!paper) {
      res.status(404).json({
        success: false,
        message: 'Paper not found',
      });
      return;
    }

    // Verify ownership
    if (paper.user_id !== req.user?.user_id) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized to access this paper',
      });
      return;
    }

    // Use paper title as search query
    const searchLimit = limit ? parseInt(limit as string, 10) : 10;
    const relatedPapers = await researchService.findRelatedPapers(paper.title, searchLimit);

    res.json({
      success: true,
      related_papers: relatedPapers,
    });
  } catch (error: any) {
    console.error('Error fetching related papers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch related papers',
    });
  }
};
