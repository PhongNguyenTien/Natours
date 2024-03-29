import User from '../models/userModel.js';
import APIFeature from '../utils/apiFeature.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { deleteOne, getOne, updateOne } from './handlerFactory.js';

const filterUpdateFields = (reqBody, fieldsArray) => {
  const updateFields = {};
  fieldsArray.forEach((el) => {
    updateFields[el] = reqBody[el];
  });
  return updateFields;
};
const getAllUsers = catchAsync(async (req, res, next) => {
  const feature = new APIFeature(User.find(), req.query);
  feature.filter().sort().limitFields().paginate();

  // EXECUTE QUERY
  const users = await feature.query;
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

const updateUserInfo = catchAsync(async (req, res, next) => {
  // 1. throw error if user posted password field
  if (req.body.password || req.body.passwordConfirm) {
    next(
      new AppError(
        'This route is not for update password. Please use /updatePassword route to update your password.',
        400,
      ),
    );
  }

  // 2. update current data
  const updateFields = filterUpdateFields(req.body, ['name', 'email']);
  const updateUser = await User.findByIdAndUpdate(req.user.id, updateFields, {
    runValidators: true, 
    new: true,
  });

  if (!updateUser) {
    return next(
      new AppError(
        'There are some errors during updating your information! Please try again.',
        500,
      ),
    );
  }
  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser,
    },
  });
});

// inactive account can not login 
const inactiveAccount = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, {active: false}, {new: true});
  res.status(204).json({
    status: "success",
    data: null,
  })
})

const getUserByID = getOne(User);

// do NOT update password!
const deleteUser = deleteOne(User);
const updateUser = updateOne(User);
export {
  getAllUsers,
  getUserByID,
  updateUserInfo,
  inactiveAccount,
  deleteUser,
  updateUser
};
