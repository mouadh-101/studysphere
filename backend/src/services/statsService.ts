import { NoteSummary, ResearchPaper, QuizAttempt, HomeworkProblem } from "../models";
import { Op } from 'sequelize';

export interface UserStats {
  notes: {
    total: number;
    completed: number;
    thisWeek: number;
  };
  research: {
    total: number;
    completed: number;
    thisWeek: number;
  };
  quizzes: {
    total: number;
    averageScore: number;
    thisWeek: number;
  };
  homework: {
    total: number;
    solved: number;
    thisWeek: number;
  };
}

export const getUserStats = async (userId: string): Promise<UserStats> => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Notes statistics
  const [totalNotes, completedNotes, notesThisWeek] = await Promise.all([
    NoteSummary.count({ where: { user_id: userId } }),
    NoteSummary.count({ where: { user_id: userId, status: 'completed' } }),
    NoteSummary.count({
      where: {
        user_id: userId,
        created_at: { [Op.gte]: oneWeekAgo },
      },
    }),
  ]);

  // Research papers statistics
  const [totalPapers, completedPapers, papersThisWeek] = await Promise.all([
    ResearchPaper.count({ where: { user_id: userId } }),
    ResearchPaper.count({ where: { user_id: userId, status: 'completed' } }),
    ResearchPaper.count({
      where: {
        user_id: userId,
        created_at: { [Op.gte]: oneWeekAgo },
      },
    }),
  ]);

  // Quiz statistics
  const quizAttempts = await QuizAttempt.findAll({
    where: { user_id: userId },
    attributes: ['score'],
  });

  const quizAttemptsThisWeek = await QuizAttempt.count({
    where: {
      user_id: userId,
      start_time: { [Op.gte]: oneWeekAgo },
    },
  });

  const averageScore = quizAttempts.length > 0
    ? quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / quizAttempts.length
    : 0;

  // Homework statistics
  const [totalHomework, solvedHomework, homeworkThisWeek] = await Promise.all([
    HomeworkProblem.count({ where: { user_id: userId } }),
    HomeworkProblem.count({ where: { user_id: userId, status: 'solved' } }),
    HomeworkProblem.count({
      where: {
        user_id: userId,
        uploaded_at: { [Op.gte]: oneWeekAgo },
      },
    }),
  ]);

  return {
    notes: {
      total: totalNotes,
      completed: completedNotes,
      thisWeek: notesThisWeek,
    },
    research: {
      total: totalPapers,
      completed: completedPapers,
      thisWeek: papersThisWeek,
    },
    quizzes: {
      total: quizAttempts.length,
      averageScore: Math.round(averageScore),
      thisWeek: quizAttemptsThisWeek,
    },
    homework: {
      total: totalHomework,
      solved: solvedHomework,
      thisWeek: homeworkThisWeek,
    },
  };
};
