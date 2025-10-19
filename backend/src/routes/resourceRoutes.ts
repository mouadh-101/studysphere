import { Router } from 'express';
import {
  uploadResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  downloadResource,
  getCategories,
  getResourcesByUser,
} from '../controllers/resourceController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../utils/fileUpload';

const router = Router();

// Debug route to test if resource routes are loaded
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Resource routes are working!',
  });
});

// Public routes
router.get('/categories', getCategories);
router.get('/', getResources);
router.get('/resource/:id', getResourceById);

// Protected routes (require authentication)
router.post('/upload', authenticateToken, upload.single('file'), uploadResource);
router.put('/resource/:id', authenticateToken, updateResource);
router.delete('/resource/:id', authenticateToken, deleteResource);
router.get('/resource/:id/download', authenticateToken, downloadResource);
router.get('/myResources', authenticateToken, getResourcesByUser);

export default router;
