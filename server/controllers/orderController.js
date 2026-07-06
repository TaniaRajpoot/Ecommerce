import Stripe from 'stripe';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';

let stripe;
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
} catch (err) {
  console.warn('Stripe initialized with missing or placeholder keys.');
}

export const createCheckoutSession = async (req, res, next) => {
  const { shippingAddress, couponCode } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      res.status(400);
      return next(new Error('Your cart is empty'));
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        res.status(400);
        return next(
          new Error(`Product ${item.product.name} is out of stock / insufficient quantity`)
        );
      }
    }

    const itemsPrice = cart.items.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );

    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isValid()) {
        if (coupon.discountType === 'Percentage') {
          discountAmount = (itemsPrice * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }

    const shippingPrice = itemsPrice > 100 ? 0 : 10;
    const taxPrice = Number((0.15 * (itemsPrice - discountAmount)).toFixed(2)); // 15% tax
    const totalPrice = Number((itemsPrice - discountAmount + taxPrice + shippingPrice).toFixed(2));

    const lineItems = cart.items.map((item) => {
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
            images: item.product.images.slice(0, 1),
          },
          unit_amount: Math.round(item.product.price * 100),
        },
        quantity: item.quantity,
      };
    });

    if (shippingPrice > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping Cost',
          },
          unit_amount: Math.round(shippingPrice * 100),
        },
        quantity: 1,
      });
    }

    if (taxPrice > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Estimated Tax (15%)',
          },
          unit_amount: Math.round(taxPrice * 100),
        },
        quantity: 1,
      });
    }

    if (!stripe) {
      res.status(500);
      return next(new Error('Stripe is not configured correctly'));
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      customer_email: req.user.email,
      metadata: {
        userId: req.user._id.toString(),
        address: shippingAddress.address,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        itemsPrice: itemsPrice.toString(),
        taxPrice: taxPrice.toString(),
        shippingPrice: shippingPrice.toString(),
        discountAmount: discountAmount.toString(),
        totalPrice: totalPrice.toString(),
      },
    });

    res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    next(error);
  }
};

export const stripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }
    event = stripe.webhooks.constructEvent(
      req.body, // must be raw body Buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const metadata = session.metadata;
      const userId = metadata.userId;

      const cart = await Cart.findOne({ user: userId }).populate('items.product');

      if (!cart || cart.items.length === 0) {
        console.error(`Fulfillment error: Cart not found for user ${userId}`);
        return res.status(400).json({ error: 'Cart not found' });
      }

      const orderItems = cart.items.map((item) => ({
        name: item.product.name,
        qty: item.quantity,
        image: item.product.images[0] || '/uploads/sample.jpg',
        price: item.product.price,
        product: item.product._id,
      }));

      const order = await Order.create({
        user: userId,
        orderItems,
        shippingAddress: {
          address: metadata.address,
          city: metadata.city,
          postalCode: metadata.postalCode,
          country: metadata.country,
        },
        paymentMethod: 'Stripe',
        paymentResult: {
          id: session.payment_intent,
          status: 'paid',
          update_time: new Date().toISOString(),
          email_address: session.customer_details.email,
        },
        itemsPrice: Number(metadata.itemsPrice),
        taxPrice: Number(metadata.taxPrice),
        shippingPrice: Number(metadata.shippingPrice),
        discountAmount: Number(metadata.discountAmount),
        totalPrice: Number(metadata.totalPrice),
        isPaid: true,
        paidAt: new Date(),
        orderStatus: 'Processing',
      });

      for (const item of cart.items) {
        await Product.findByIdAndUpdate(item.product._id, {
          $inc: { stock: -item.quantity },
        });
      }

      cart.items = [];
      await cart.save();

      console.log(`Order ${order._id} fulfilled successfully!`);
      res.status(201).json({ success: true });
    } catch (err) {
      console.error(`Fulfillment logic error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(200).json({ received: true });
  }
};

export const createManualOrder = async (req, res, next) => {
  const { shippingAddress, couponCode, paymentMethod } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      res.status(400);
      return next(new Error('Your cart is empty'));
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        res.status(400);
        return next(
          new Error(`Product ${item.product.name} is out of stock / insufficient quantity`)
        );
      }
    }

    const itemsPrice = cart.items.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );

    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isValid()) {
        if (coupon.discountType === 'Percentage') {
          discountAmount = (itemsPrice * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }

    const shippingPrice = itemsPrice > 100 ? 0 : 10;
    const taxPrice = Number((0.15 * (itemsPrice - discountAmount)).toFixed(2));
    const totalPrice = Number((itemsPrice - discountAmount + taxPrice + shippingPrice).toFixed(2));

    const orderItems = cart.items.map((item) => ({
      name: item.product.name,
      qty: item.quantity,
      image: item.product.images[0] || '/uploads/sample.jpg',
      price: item.product.price,
      product: item.product._id,
    }));

    const order = await Order.create({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD (Cash On Delivery)',
      itemsPrice,
      taxPrice,
      shippingPrice,
      discountAmount,
      totalPrice,
      isPaid: false,
    });

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to view this order'));
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
