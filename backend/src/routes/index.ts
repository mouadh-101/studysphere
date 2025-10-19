import { Router } from 'express';
import authRoutes from './authRoutes';
import researchRoutes from './researchRoutes';


const router = Router();

router.use('/auth', authRoutes);
router.use('/research', researchRoutes);


// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'StudySphere API is running!',
    timestamp: new Date().toISOString(),
  });
});

export default router;