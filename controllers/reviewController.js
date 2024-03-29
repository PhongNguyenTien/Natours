import APIFeature from '../utils/apiFeature.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import Review from './../models/reviewModel.js';
import { getAll, getOne } from './handlerFactory.js';

const getAllReviewsByReviewId = getOne(Review);

const getAllReviews = catchAsync(async (req, res, next) => {
  const feature = new APIFeature(Review.find(), req.query);
  feature.filter().sort().limitFields().paginate();
  let {query} = feature;
  if (req.params.tourId) {
    query = query.find({tour: req.params.tourId});
  }
  const reviews = await query;
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
  const newReview = await Review.create({ ...req.body, user: currentUser.id });
  res.status(201).json({
    status: 'success',
    data: {
      newReview,
    },
  });
});

const getReviewById = getOne(Review);

const updateReview = catchAsync(async (req, res, next) => {
  const currentUser = req.user;
  if (!currentUser) {
    next(
      new AppError('The token is invalid or expired. Please try again!', 400),
    );
    return;
  }

  const updateReview = await Review.findOne({
    user: currentUser.id,
    _id: req.params.id,
  });
  if (!updateReview) {
    return next(
      new AppError('The review does not exist. Please try again!', 404),
    );
  }
  updateReview.review = req.body.review;
  await updateReview.save();
  res.status(200).json({
    status: 'success',
    data: {
      updateReview,
    },
  });
});

const deleteReview = catchAsync(async (req, res, next) => {
  const currentUser = req.user;
  if (!currentUser) {
    next(
      new AppError('The token is invalid or expired. Please try again!', 400),
    );
    return;
  }

  const deleteReview = await Review.deleteOne({
    user: currentUser.id,
    _id: req.params.id,
  });
  res.status(204).json({
    status: 'success',
  });
});

export {
  getAllReviewsByReviewId,
  addReview,
  updateReview,
  getReviewById,
  deleteReview,
  getAllReviews,
};
