import express from 'express';
import {
  getUsers,
  updateUserRole,
  getAllOrders,
  updateOrderStatus,
  getDashboardAnalytics,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();


router.use(protect);
router.use(admin);

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);

router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

router.get('/analytics', getDashboardAnalytics);

export default router;
