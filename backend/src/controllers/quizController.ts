import { Request, Response } from 'express';
import { generateQuizWithGemini } from '../services/geminiService';
import { Quiz, QuizQuestion } from '../models';
import { upload } from '../utils/fileUpload';
import { QuizService } from '../services/quizService';

export const generateQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { numQuestions, difficulty } = req.body;
    const user_id = (req as any).user.user_id;
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    // Call Gemini to generate quiz using file path
    const quizData = await generateQuizWithGemini({
      filePath: req.file.path,
      numQuestions: Number(numQuestions),
      difficulty,
    });

    // Save quiz to DB
    const quiz = await Quiz.create({
      user_id,
      quiz_title: quizData.quiz_title,
      subject: quizData.subject,
      file_url: `/uploads/${req.file.filename}`,
      created_at: new Date(),
    });

    // Save questions
    for (const q of quizData.questions) {
      await QuizQuestion.create({
        quiz_id: quiz.quiz_id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Quiz generated and saved',
      data: { quiz_id: quiz.quiz_id },
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate quiz',
    });
  }
};

/**
 * Get all quizzes for the authenticated user
 */
export const getUserQuizzes = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = (req as any).user.user_id;

    const quizzes = await QuizService.getUserQuizzes(user_id);

    res.status(200).json({
      success: true,
      message: 'Quizzes fetched successfully',
      data: { quizzes },
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch quizzes',
    });
  }
};

/**
 * Get a single quiz by ID (only for owner)
 */
export const getQuizById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user_id = (req as any).user.user_id;

    const quiz = await QuizService.getQuizById(id, user_id);

    if (!quiz) {
      res.status(404).json({
        success: false,
        message: 'Quiz not found or unauthorized',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Quiz fetched successfully',
      data: { quiz },
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch quiz',
    });
  }
};

/**
 * Delete a quiz (only by owner)
 */
export const deleteQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user_id = (req as any).user.user_id;

    await QuizService.deleteQuiz(id, user_id);

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete quiz',
    });
  }
};

/**
 * Submit quiz attempt (only by owner)
 */
export const submitQuizAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // quiz_id
    const { answers } = req.body; // { question_id: selected_answer }
    const user_id = (req as any).user.user_id;

    if (!answers || typeof answers !== 'object') {
      res.status(400).json({
        success: false,
        message: 'Answers are required',
      });
      return;
    }

    const result = await QuizService.submitQuizAttempt(id, user_id, answers);

    res.status(201).json({
      success: true,
      message: 'Quiz attempt submitted successfully',
      data: {
        attempt_id: result.attempt.attempt_id,
        score: result.score,
        total: result.total,
        percentage: result.attempt.score,
      },
    });
  } catch (error) {
    console.error('Submit quiz attempt error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit quiz attempt',
    });
  }
};

/**
 * Get all attempts for a quiz (only for owner)
 */
export const getQuizAttempts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // quiz_id
    const user_id = (req as any).user.user_id;

    const attempts = await QuizService.getQuizAttempts(id, user_id);

    res.status(200).json({
      success: true,
      message: 'Quiz attempts fetched successfully',
      data: { attempts },
    });
  } catch (error) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch quiz attempts',
    });
  }
};

/**
 * Get a specific attempt by ID (only for owner)
 */
export const getAttemptById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const user_id = (req as any).user.user_id;

    const attempt = await QuizService.getAttemptById(attemptId, user_id);

    if (!attempt) {
      res.status(404).json({
        success: false,
        message: 'Attempt not found or unauthorized',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Attempt fetched successfully',
      data: { attempt },
    });
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch attempt',
    });
  }
};

