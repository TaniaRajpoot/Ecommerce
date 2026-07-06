import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please add a coupon code'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [15, 'Coupon code cannot exceed 15 characters'],
    },
    discountType: {
      type: String,
      required: true,
      enum: ['Percentage', 'Flat'],
      default: 'Percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Please add a discount value'],
      min: [0, 'Discount value cannot be negative'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Please add an expiry date'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.methods.isValid = function () {
  return this.isActive && new Date() < this.expiryDate;
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
