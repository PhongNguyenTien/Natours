import express from 'express';
import { protect, restrictTo } from '../controllers/authController.js';
import {
  addReview,
  deleteReview,
  getAllReviews,
  getAllReviewsByReviewId,
  getReviewById,
  updateReview,
} from '../controllers/reviewController.js';

const reviewRouter = express.Router({mergeParams: true}); // cho phép lấy params từ parent route (reviewRouter có 1 parent là tourRouter)

reviewRouter.route('/').get(getAllReviews).post(protect, addReview);
reviewRouter
  .route('/:id').get(getAllReviewsByReviewId)
  .patch(protect, updateReview)
  .delete(protect, deleteReview);

export default reviewRouter;
