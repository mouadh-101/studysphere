import { Sequelize, where } from 'sequelize';
import { Quiz, QuizQuestion, QuizAttempt } from '../models';
import User from '../models/User';

export class QuizService {
    /**
     * Get all quizzes for a specific user
     */
    static async getUserQuizzes(user_id: string): Promise<Quiz[]> {
        try {
            const quizzes = await Quiz.findAll({
                where: { user_id },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['user_id', 'full_name', 'email'],
                    },
                    {
                        model: QuizQuestion,
                        as: 'questions', // must match your association alias
                        attributes: [], // we don't need actual question data
                    },
                ],
                attributes: {
                    include: [
                        [
                            Sequelize.fn('COUNT', Sequelize.col('questions.question_id')),
                            'questionCount',
                        ],
                    ],
                },
                group: ['Quiz.quiz_id', 'user.user_id'], // include all non-aggregated selected fields
                order: [['created_at', 'DESC']],
            });

            // Convert questionCount from string to number (Sequelize returns string for COUNT)
            return quizzes.map((quiz: any) => {
                quiz.setDataValue('questionCount', parseInt(quiz.get('questionCount'), 10));
                return quiz;
            });
        } catch (error) {
            throw new Error(`Failed to fetch quizzes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get a single quiz by ID (with questions)
     */
    static async getQuizById(quiz_id: string, user_id: string): Promise<Quiz | null> {
        try {
            const quiz = await Quiz.findOne({
                where: { quiz_id, user_id }, // Ensure user owns the quiz
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['user_id', 'full_name', 'email']
                    },
                    {
                        model: QuizQuestion,
                        as: 'questions',
                        attributes: ['question_id', 'question_text', 'options', 'correct_answer'],
                    },
                ],
            });

            return quiz;
        } catch (error) {
            throw new Error(`Failed to fetch quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Delete a quiz (only by owner)
     */
    static async deleteQuiz(quiz_id: string, user_id: string): Promise<void> {
        try {
            const quiz = await Quiz.findOne({
                where: { quiz_id, user_id },
            });

            if (!quiz) {
                throw new Error('Quiz not found or unauthorized');
            }

            // Delete associated questions first
            await QuizQuestion.destroy({ where: { quiz_id } });

            // Delete associated attempts
            await QuizAttempt.destroy({ where: { quiz_id } });

            // Delete quiz
            await quiz.destroy();
        } catch (error) {
            throw new Error(`Failed to delete quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Submit quiz attempt and calculate score
     */
    static async submitQuizAttempt(
        quiz_id: string,
        user_id: string,
        answers: Record<string, string> // { question_id: selected_answer }
    ): Promise<{ attempt: QuizAttempt; score: number; total: number }> {
        try {
            // Verify quiz ownership
            const quiz = await Quiz.findOne({
                where: { quiz_id, user_id },
                include: [{ model: QuizQuestion, as: 'questions' }],
            });

            if (!quiz) {
                throw new Error('Quiz not found or unauthorized');
            }

            const questions = quiz.questions || [];
            if (questions.length === 0) {
                throw new Error('Quiz has no questions');
            }

            // Calculate score
            let correctCount = 0;
            const totalQuestions = questions.length;

            questions.forEach((question) => {
                const userAnswer = answers[question.question_id];
                if (userAnswer && userAnswer === question.correct_answer) {
                    correctCount++;
                }
            });

            const scorePercentage = (correctCount / totalQuestions) * 100;

            // Create attempt record
            const attempt = await QuizAttempt.create({
                user_id,
                quiz_id,
                start_time: new Date(),
                end_time: new Date(),
                score: scorePercentage,
                answers: answers,
                completed: true,
            });

            return {
                attempt,
                score: correctCount,
                total: totalQuestions,
            };
        } catch (error) {
            throw new Error(`Failed to submit quiz attempt: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get all attempts for a specific quiz
     */
    static async getQuizAttempts(quiz_id: string, user_id: string): Promise<QuizAttempt[]> {
        try {
            // Verify quiz ownership
            const quiz = await Quiz.findOne({
                where: { quiz_id, user_id },
            });

            if (!quiz) {
                throw new Error('Quiz not found or unauthorized');
            }

            const attempts = await QuizAttempt.findAll({
                where: { quiz_id, user_id },
                order: [['start_time', 'DESC']],
            });

            return attempts;
        } catch (error) {
            throw new Error(`Failed to fetch attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get a specific attempt with details
     */
    static async getAttemptById(attempt_id: string, user_id: string): Promise<QuizAttempt | null> {
        try {
            const attempt = await QuizAttempt.findOne({
                where: { attempt_id, user_id },
                include: [
                    {
                        model: Quiz,
                        as: 'quiz',
                        include: [
                            {
                                model: QuizQuestion,
                                as: 'questions',
                            },
                        ],
                    },
                ],
            });

            return attempt;
        } catch (error) {
            throw new Error(`Failed to fetch attempt: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
