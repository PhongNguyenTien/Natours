import mongoose from 'mongoose';
import Tour from './tourModel.js';
import User from './userModel.js';

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'The review must have content!'],
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: 'The review content must not be empty',
      },
    },
    rating: {
      type: Number,
      enum: {
        values: [1, 2, 3, 4, 5],
        message: 'The rating must be integer and between 1 and 5',
      },
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour!'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user!'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: { name: 1, photo: 1, _id: 0 },
  });
  next();
});
const Review = mongoose.model('Review', reviewSchema);

export default Review;
