import Tour from '../models/tourModel.js';
import APIFeature from '../utils/apiFeature.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { deleteOne, getAll, getOne, updateOne } from './handlerFactory.js';

// const checkID = (req, res, next, value) => {
//   if (value * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'error',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };

const aliasTop5Tours = (req, res, next) => {
  req.query.limit = 5;
  (req.query.sort = '-ratingsAverage,price'),
    (req.query.fields =
      'name,price,duration,ratingsAverage,summary,difficulty');
  next();
};

const getAllTours = getAll(Tour);

const addTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

const getTourByID = getOne(Tour, { path: 'reviews' });

const updateTour = updateOne(Tour);

const deleteTour = deleteOne(Tour);

const getToursStats = catchAsync(async (req, res, next) => {
  const toursStats = await Tour.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.5 },
      },
    },
    {
      $group: {
        _id: '$ratingsAverage',
        numTours: { $sum: 1 },
        avgRatings: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        avgDuration: { $avg: '$duration' },
        avgRatingsQuantity: { $avg: '$ratingsQuantity' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $match: {
        avgRatingsQuantity: { $gte: 0 },
      },
    },
    {
      $sort: {
        avgPrice: 1,
        numTours: -1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      toursStats,
    },
  });
});

const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStartPerMonth: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numToursStartPerMonth: -1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      numsTour: plan.length,
      plan,
    },
  });
});

// '/radius/:radius/center/:center'
const getToursBasedOnCircle = catchAsync(async (req, res, next) => {
  const { radius, center } = req.params;
  // order of lat and long in data: [lat, long]
  const [latitude, longitude] = center.split(',');
  if (!latitude || !longitude) {
    return next(
      new AppError('Please provide both latitude and longitude!', 400),
    );
  }
  const withinTours = await Tour.find({
    startLocation: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius / 6378.1] },
    },
  });
  console.log('withinTours', withinTours);

  res.status(200).json({
    status: 'success',
    result: withinTours.length,
    data: {
      nearTour: withinTours,
    },
  });
});

const getDistanceFromUserToTour = catchAsync(async (req, res, next) => {
  const { center } = req.params;
  const [latitude, longitude] = center.split(',');
  if (!latitude || !longitude) {
    return next(
      new AppError('Please provide both latitude and longitude!', 400),
    );
  }
  const toursAndDistance =
    await Tour.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude * 1, latitude * 1] },
          distanceField: 'distance',
          distanceMultiplier: 0.001,
        },
      },
      {
        $project: {
          name: 1,
          distance: 1
        }
      }
    ]);
  console.log('tours and distance: ', toursAndDistance);

  res.status(200).json({
    status: 'success',
    toursAndDistance,
  });
});

export {
  getAllTours,
  addTour,
  getTourByID,
  updateTour,
  aliasTop5Tours,
  getToursStats,
  getMonthlyPlan,
  deleteTour,
  getToursBasedOnCircle,
  getDistanceFromUserToTour,
};
