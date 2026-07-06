import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

export const createProductReview = async (req, res, next) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      res.status(404);
      return next(new Error('Product not found'));
    }

    // Optional: Verified Purchase Check (uncomment in production to restrict reviews)
    /*
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      isPaid: true,
      'orderItems.product': productId,
    });
    if (!hasPurchased) {
      res.status(400);
      return next(new Error('You must purchase the product before writing a review.'));
    }
    */

    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      alreadyReviewed.rating = rating;
      alreadyReviewed.comment = comment;
      await alreadyReviewed.save();

      res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: alreadyReviewed,
      });
    } else {
      const review = await Review.create({
        name: req.user.name,
        rating: Number(rating),
        comment,
        product: productId,
        user: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: 'Review added successfully',
        data: review,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).populate(
      'user',
      'name'
    );

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      return next(new Error('Review not found'));
    }

    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      res.status(403);
      return next(new Error('Not authorized to delete this review'));
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
