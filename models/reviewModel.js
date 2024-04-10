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

// combination index: each user can only 1 review for each tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.statics.calRatingsPerTour = async function (tourId) {
  const statsRatings = await this.aggregate([
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: '$tour',
        ratingsAverage: { $avg: '$rating' },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);
  console.log('statsRatings: ', statsRatings);
  const updateRatingsTour = await Tour.findById(tourId);
  if (statsRatings.length > 0) {
    updateRatingsTour.ratingsAverage = statsRatings[0].ratingsAverage;
    updateRatingsTour.ratingsQuantity = statsRatings[0].ratingsQuantity;
  } else {
    updateRatingsTour.ratingsAverage = 4.5;
    updateRatingsTour.ratingsQuantity = 0;
  }
  await updateRatingsTour.save();
};

// calculate ratings per tour after create new review or update existing review
reviewSchema.post('save', async function () {
  this.constructor.calRatingsPerTour(this.tour);
});

// calculate ratings per tour after delete existing reviews
reviewSchema.pre('findOneAndDelete', async function (next) {
  this.doc = await this.clone().find();
  console.log('this.doc: ', this.doc);
  next();
});
reviewSchema.post('findOneAndDelete', async function () {
  this.doc[0].constructor.calRatingsPerTour(this.doc[0].tour);
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
