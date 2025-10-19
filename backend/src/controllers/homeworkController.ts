import { Request, Response } from 'express';
import HomeworkProblem, { ProblemStatus } from '../models/HomeworkProblem';
import ProblemSolution from '../models/ProblemSolution';
import { processHomework, deleteProblem } from '../services/homeworkService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

/**
 * Upload homework file and trigger processing
 */
export const uploadHomework = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const fileUrl = req.file.path; // Path to uploaded file
    const problemImageUrl = req.file.filename; // Filename for reference

    // Create problem record
    const problem = await HomeworkProblem.create({
      user_id: userId,
      file_url: fileUrl,
      problem_image_url: problemImageUrl,
      type: 'mathematic' as any, // Will be updated after classification
      status: ProblemStatus.PENDING,
    } as any);

    // Trigger async processing (non-blocking)
    processHomework(problem.problem_id).catch((error) => {
      console.error('Background processing error:', error);
    });

    res.status(201).json({
      success: true,
      data: {
        problemId: problem.problem_id,
        status: problem.status,
      },
      message: 'Homework uploaded successfully. Processing in progress...',
    });
  } catch (error: any) {
    console.error('Upload homework error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload homework',
      message: error.message,
    });
  }
};

/**
 * Get solution for a specific problem
 */
export const getProblemSolution = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;
    const { problemId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Find problem with solution
    const problem = await HomeworkProblem.findOne({
      where: { problem_id: problemId, user_id: userId },
      include: [
        {
          model: ProblemSolution,
          as: 'solutions',
        },
      ],
    });

    if (!problem) {
      res.status(404).json({ success: false, error: 'Problem not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        problem: {
          problemId: problem.problem_id,
          fileUrl: problem.file_url,
          problemImageUrl: problem.problem_image_url,
          extractedText: problem.ocr_extracted_text,
          type: problem.type,
          status: problem.status,
          uploadedAt: problem.uploaded_at,
        },
        solution: problem.solutions && problem.solutions.length > 0 ? {
          solutionId: problem.solutions[0].solution_id,
          stepByStepSolution: problem.solutions[0].step_by_step_solution,
          finalAnswer: problem.solutions[0].final_answer,
          explanation: problem.solutions[0].explanation,
          createdAt: problem.solutions[0].created_at,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Get problem solution error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve problem solution',
      message: error.message,
    });
  }
};

/**
 * Get all homework problems for the authenticated user
 */
export const getUserHomework = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const problems = await HomeworkProblem.findAll({
      where: { user_id: userId },
      include: [
        {
          model: ProblemSolution,
          as: 'solutions',
        },
      ],
      order: [['uploaded_at', 'DESC']],
    });

    const formattedProblems = problems.map((problem) => ({
      problemId: problem.problem_id,
      fileUrl: problem.file_url,
      problemImageUrl: problem.problem_image_url,
      extractedText: problem.ocr_extracted_text,
      type: problem.type,
      status: problem.status,
      uploadedAt: problem.uploaded_at,
      hasSolution: problem.solutions && problem.solutions.length > 0,
    }));

    res.status(200).json({
      success: true,
      data: formattedProblems,
    });
  } catch (error: any) {
    console.error('Get user homework error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve homework',
      message: error.message,
    });
  }
};

/**
 * Delete a homework problem
 */
export const deleteHomework = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id;
    const { problemId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    await deleteProblem(problemId, userId);

    res.status(200).json({
      success: true,
      message: 'Problem deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete homework error:', error);
    
    if (error.message.includes('Unauthorized')) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message,
      });
      return;
    }

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete problem',
      message: error.message,
    });
  }
};
