import express from 'express';
import {
  getAllTours,
  addTour,
  getTourByID,
  updateTour,
  deleteTour,
  aliasTop5Tours,
  getToursStats,
  getMonthlyPlan,
} from '../controllers/tourController.js';
import { protect, restrictTo } from '../controllers/authController.js';

import reviewRouter from './reviewRouter.js';

const tourRouter = express.Router();

tourRouter.route('/top-5-tours').get(aliasTop5Tours, getAllTours);
tourRouter.route('/tours-stats').get(protect, getToursStats);
tourRouter.route('/monthly-plan/:year').get(protect, restrictTo(['admin', 'lead-guide', 'guide']), getMonthlyPlan);

tourRouter.route('/').get(getAllTours).post(protect, restrictTo(['admin', 'lead-guide']), addTour);
tourRouter
  .route('/:id')
  .get(getTourByID)
  .patch(protect, restrictTo(['admin', 'lead-guide']), updateTour)
  .delete(protect, restrictTo(['admin', 'lead-guide']), deleteTour);
tourRouter.use('/:tourId/reviews', reviewRouter)


export default tourRouter;
