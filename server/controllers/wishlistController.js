import User from '../models/User.js';

export const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: { path: 'category', select: 'name' },
    });

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    res.status(200).json({
      success: true,
      count: user.wishlist.length,
      data: user.wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req, res, next) => {
  const { productId } = req.params;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    const index = user.wishlist.indexOf(productId);

    if (index > -1) {
      user.wishlist.splice(index, 1);
      await user.save();
      res.status(200).json({
        success: true,
        message: 'Product removed from wishlist',
        data: user.wishlist,
      });
    } else {
      user.wishlist.push(productId);
      await user.save();
      res.status(200).json({
        success: true,
        message: 'Product added to wishlist',
        data: user.wishlist,
      });
    }
  } catch (error) {
    next(error);
  }
};
