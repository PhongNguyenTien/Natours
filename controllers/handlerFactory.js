import APIFeature from '../utils/apiFeature.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

const deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
    });
  });
};

const updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });
};

const createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });
};

const getOne = (Model, populateOption) => {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOption) {
      query = query.populate(populateOption);
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        quantity: doc.length,
        doc,
      },
    });
  });
};

const getAll = (Model) => {
  return catchAsync(async (req, res, next) => {
    const feature = new APIFeature(Model.find(), req.query);
    feature.filter().sort().limitFields().paginate();

    // EXECUTE QUERY
    const docs = await feature.query;
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        docs
      },
    });
  });
};

export { deleteOne, updateOne, createOne, getOne, getAll };
