import Tour from '../models/tourModel.js';
import APIFeature from '../utils/apiFeature.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

const checkID = (req, res, next, value) => {
  if (value * 1 > tours.length) {
    return res.status(404).json({
      status: 'error',
      message: 'Invalid ID',
    });
  }
  next();
};

const aliasTop5Tours = (req, res, next) => {
  req.query.limit = 5;
  (req.query.sort = '-ratingsAverage,price'),
    (req.query.fields =
      'name,price,duration,ratingsAverage,summary,difficulty');
  next();
};

const getAllTours = catchAsync(async (req, res, next) => {
  const feature = new APIFeature(Tour.find(), req.query);
  feature.filter().sort().limitFields().paginate();

  // EXECUTE QUERY
  const tours = await feature.query;
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours: tours,
    },
  });
});

const addTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body); 
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

const getTourByID = catchAsync(async (req, res, next) => {
  
  console.log(req.params.id )

  const tour = await Tour.findById(req.params.id).populate('reviews')
  

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: tour,
    },
  });
});

const updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});
const deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

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

export {
  getAllTours,
  addTour,
  getTourByID,
  updateTour,
  deleteTour,
  checkID,
  aliasTop5Tours,
  getToursStats,
  getMonthlyPlan,
};
