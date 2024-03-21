import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import Review from './../models/reviewModel.js';

const getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({tour: req.params.tourId});
  res.status(200).json({
    status: 'success',
    quantity: reviews.length,
    data: {
      reviews,
    },
  });
});

const addReview = catchAsync(async (req, res, next) => {
  const currentUser = req.user;
  if (!currentUser) {
    next(
      new AppError('The token is invalid or expired. Please try again!', 400),
    );
    return;
  }
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  const newReview = await Review.create({...req.body, user: currentUser.id});
  res.status(201).json({
    status: 'success',
    data: { 
      newReview,
    },
  });
});

const getReviewById = catchAsync(async (req, res, next) => {
  const review = await Review.find({_id: req.params.reviewId});

  res.status(200).json({
    status: 'success',
    data: {
      review,
    }
  })
});

const updateReview = catchAsync(async (req, res, next) => {
  const currentUser = req.user;
  if (!currentUser) {
    next(
      new AppError('The token is invalid or expired. Please try again!', 400),
    );
    return;
  }

  const updateReview = await Review.findOne({user: currentUser.id, _id: req.params.reviewId});
  if (!updateReview) {
    return next(new AppError('The review does not exist. Please try again!', 404))
  }
  updateReview.review = req.body.review;
  await updateReview.save();
  res.status(200).json({
    status: 'success',
    data: {
      updateReview,
    }
  })
});

const deleteReview = catchAsync(async (req, res, next) => {
  const currentUser = req.user;
  if (!currentUser) {
    next(
      new AppError('The token is invalid or expired. Please try again!', 400),
    );
    return;
  }

  const deleteReview = await Review.deleteOne({user: currentUser.id, _id: req.params.reviewId});
  res.status(204).json({
    status: 'success',
  })
});

export {
  getAllReviews,
  addReview,
  updateReview,
  getReviewById,
  deleteReview
};
