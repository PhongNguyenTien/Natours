import express from 'express';
import {
  getAllUsers,
  getUserByID,
  updateUserInfo,
  inactiveAccount,
  deleteUser,
  updateUser,
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
userRouter.route('/updatePassword').patch(protect, updatePassword);
userRouter.route('/updateUserInformation').patch(protect, updateUserInfo);
userRouter.route('/inactiveAccount').delete(protect, inactiveAccount);

userRouter.route('/').get(protect, getAllUsers);
userRouter
  .route('/:id')
  .get(protect, getUserByID)
  .delete(protect, restrictTo(['admin']), deleteUser)
  .patch(protect, restrictTo(['admin']), updateUser);

export default userRouter;
