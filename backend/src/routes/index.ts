import { Router } from 'express';
import authRoutes from './authRoutes';
import resourceRoutes from './resourceRoutes';
import quizRoutes from './quizRoutes';
import languageRoutes from './languageRoutes';
import homeworkRoutes from './homeworkRoutes';
import researchRoutes from './researchRoutes';
import noteSummarizerRoutes from './noteSummarizerRoutes';
import statsRoutes from './statsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/resources', resourceRoutes);
router.use('/quiz', quizRoutes);
router.use('/language', languageRoutes);
router.use('/homework', homeworkRoutes);
router.use('/research', researchRoutes);
router.use('/notes', noteSummarizerRoutes);
router.use('/stats', statsRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'StudySphere API is running!',
    timestamp: new Date().toISOString(),
  });
});

export default router;