import express from 'express';
import {
  createCheckoutSession,
  stripeWebhook,
  createManualOrder,
  getMyOrders,
  getOrderById,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

router.post('/checkout-session', protect, createCheckoutSession);
router.post('/', protect, createManualOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

export default router;
