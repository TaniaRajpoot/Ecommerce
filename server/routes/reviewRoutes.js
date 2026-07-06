import express from 'express';
import {
  createProductReview,
  getProductReviews,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/:productId')
  .get(getProductReviews)
  .post(protect, createProductReview);

router.route('/:id').delete(protect, deleteReview);

export default router;
