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

reviewRouter.use(protect);

reviewRouter.route('/').get(getAllReviews).post(restrictTo(['user']), addReview);

reviewRouter
  .route('/:id').get(getAllReviewsByReviewId)
  .patch(restrictTo(['user']), updateReview)
  .delete(restrictTo(['user']), deleteReview);

export default reviewRouter;
