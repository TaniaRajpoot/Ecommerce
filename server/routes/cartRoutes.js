import express from 'express';
import {
  getCart,
  addItemToCart,
  updateCartItemQty,
  removeItemFromCart,
  clearCart,
} from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getCart)
  .post(addItemToCart)
  .delete(clearCart);

router
  .route('/:productId')
  .put(updateCartItemQty)
  .delete(removeItemFromCart);

export default router;
