import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

export const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const populatedCart = await cart.populate({
      path: 'items.product',
      select: 'name price images stock description',
    });

    res.status(200).json({
      success: true,
      data: populatedCart,
    });
  } catch (error) {
    next(error);
  }
};

export const addItemToCart = async (req, res, next) => {
  const { productId, quantity } = req.body;
  const qty = Number(quantity) || 1;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    if (product.stock < qty) {
      res.status(400);
      return next(new Error(`Only ${product.stock} items left in stock`));
    }

    const cart = await getOrCreateCart(req.user._id);

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + qty;
      if (product.stock < newQty) {
        res.status(400);
        return next(new Error(`Cannot add more. Total in cart: ${newQty}, Stock: ${product.stock}`));
      }
      cart.items[itemIndex].quantity = newQty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    const populatedCart = await cart.populate({
      path: 'items.product',
      select: 'name price images stock',
    });

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: populatedCart,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItemQty = async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const qty = Number(quantity);

  if (isNaN(qty) || qty <= 0) {
    res.status(400);
    return next(new Error('Invalid quantity'));
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    if (product.stock < qty) {
      res.status(400);
      return next(new Error(`Only ${product.stock} items left in stock`));
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      return next(new Error('Cart not found'));
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = qty;
      await cart.save();

      const populatedCart = await cart.populate({
        path: 'items.product',
        select: 'name price images stock',
      });

      res.status(200).json({
        success: true,
        message: 'Cart item updated',
        data: populatedCart,
      });
    } else {
      res.status(404);
      next(new Error('Product not in cart'));
    }
  } catch (error) {
    next(error);
  }
};

export const removeItemFromCart = async (req, res, next) => {
  const { productId } = req.params;

  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      return next(new Error('Cart not found'));
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    const populatedCart = await cart.populate({
      path: 'items.product',
      select: 'name price images stock',
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: populatedCart,
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};
