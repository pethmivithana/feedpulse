import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  getAISummary,
  getStats,
  reanalyze,
} from '../controllers/feedback.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Rate limiter: 5 submissions per hour per IP
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Rate Limit', message: 'Too many submissions. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/', submitLimiter, createFeedback);

// Admin-only routes
router.get('/', authMiddleware, getAllFeedback);
router.get('/summary', authMiddleware, getAISummary);
router.get('/stats', authMiddleware, getStats);
router.get('/:id', authMiddleware, getFeedbackById);
router.patch('/:id', authMiddleware, updateFeedback);
router.post('/:id/reanalyze', authMiddleware, reanalyze);
router.delete('/:id', authMiddleware, deleteFeedback);

export default router;
