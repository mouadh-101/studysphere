import { Router } from 'express';
import authRoutes from './authRoutes';
import homeworkRoutes from './homeworkRoutes';


const router = Router();

router.use('/auth', authRoutes);
router.use('/homework', homeworkRoutes);


// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'StudySphere API is running!',
    timestamp: new Date().toISOString(),
  });
});

export default router;