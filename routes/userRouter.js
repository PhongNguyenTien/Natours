import express from 'express';
import {
  getAllUsers,
  getUserByID,
  updateUserInfo,
  inactiveAccount,
  deleteUser,
  updateUser,
  addIdParam,
} from '../controllers/userController.js';
import {
  signUp,
  login,
  forgotPassword,
  resetPassword,
  protect,
  updatePassword,
  restrictTo,
} from '../controllers/authController.js';

const userRouter = express.Router();

userRouter.route('/signup').post(signUp);
userRouter.route('/login').post(login);
userRouter.route('/forgotPassword').post(forgotPassword);
userRouter.route('/resetPassword/:resetToken').patch(resetPassword);

// protect all below routes by middleware
userRouter.use(protect);
userRouter.route('/me').get(addIdParam, getUserByID);
userRouter.route('/updatePassword').patch(updatePassword);
userRouter.route('/updateUserInformation').patch(updateUserInfo);
userRouter.route('/inactiveAccount').delete(inactiveAccount);

// only admin:
userRouter.use(restrictTo(['admin']));
userRouter.route('/').get(getAllUsers);
userRouter
  .route('/:id')
  .get(getUserByID)
  .delete(deleteUser)
  .patch(updateUser);

export default userRouter;
