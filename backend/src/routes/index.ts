import { Router } from 'express';
import authRoutes from './authRoutes';
import homeworkRoutes from './homeworkRoutes';
import noteSummarizerRoutes from './noteSummarizerRoutes';
import languageRoutes from './languageRoutes';
const router = Router();

router.use('/auth', authRoutes);
router.use('/homework', homeworkRoutes);
router.use('/notes', noteSummarizerRoutes);
router.use('/language', languageRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'StudySphere API is running!',
    timestamp: new Date().toISOString(),
  });
});

export default router;