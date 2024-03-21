import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { sendEmail } from '../utils/email.js';
import crypto from 'crypto';

const createTokenByID = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendToken = (user, statusCode, res) => {
  const token = createTokenByID(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  user.passwordChangedAt = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    }
  });
};
// đăng kí 1 user mới:
const signUp = catchAsync(async (req, res, next) => {
 
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: new Date().getTime(),

  });

  sendToken(newUser, 201, res);
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. check if the email and password exists:
  if (!email || !password) {
    next(new AppError('Please provide both email and password!', 400));
    return;
  }
  // 2. check the email and password is correct:
  const loginUser = await User.findOne({ email }).select('+password'); // override "select: false" in user model by select() method.
  if (
    !loginUser ||
    !(await loginUser.correctPassword(password, loginUser.password))
  ) {
    next(new AppError('Incorrect email or password! Please try again!', 401));
    return;
  }

  // 3. if everything is ok, sent token to the client:
  sendToken(loginUser, 200, res);
});

const protect = catchAsync(async (req, res, next) => {
  // 1. Check the token exists
  let token = '';
  // token was sent via req's headers by client
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    next(
      new AppError('You are not logged in! Please log in to get access!', 401),
    );
  }
  // 2. Verify the token (valid token or not expired)
  const verifyPromise = promisify(jwt.verify);
  const decodedFromToken = await verifyPromise(token, process.env.JWT_SECRET);

  // 3. Check if user still exists (user có thể k còn tồn tại (bị xóa) nhưng token vẫn valid)
  const currentUser = await User.findById(decodedFromToken.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user corresponding to the token does no longer exist!',
        401,
      ),
    );
  }

  // 4. Check if the user changed the password after the token was issued
  if (currentUser.passwordChangeAfterJWTCreate(decodedFromToken.iat)) {
    next(
      new AppError('User recently changed password! Please log in again!', 401),
    );
    return;
  }

  // để sử dụng trong phần authorization.
  req.user = currentUser;

  // access to protected route
  next();
});

const restrictTo = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(
        new AppError('You have not permission to access this content!', 403),
      );
      return;
    }
    next();
  };
};

const forgotPassword = catchAsync(async (req, res, next) => {
  // 1. check if the email exist
  const currentUser = await User.findOne({ email: req.body.email });
  if (!currentUser) {
    next(new AppError('There is no user with this address!', 404));
    return;
  }

  // 2. generate the reset token
  const resetToken = currentUser.createResetToken();
  await currentUser.save();

  // 3. Send the token via email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Click the following URL to send the PATCH request with new provided temporary password: \n ${resetURL} \n If you not, it looks like someone want to change your password.`;
    await sendEmail({
      email: currentUser.email,
      subject: 'Reset the password (time limit: 10 minutes)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'The reset password request have been sent successfully!',
    });
  } catch (error) {
    currentUser.passwordResetToken = undefined;
    currentUser.passwordResetTokenExpiration = undefined;

    next(error);
    return;
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get the user based on the token.
  if (!req.params.resetToken) {
    next(
      new AppError(
        'Please provide the reset token sended via private email!',
        400,
      ),
    );
    return;
  }

  const currentUser = await User.findOne({
    passwordResetToken: crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex'),
    passwordResetTokenExpiration: { $gt: Date.now() },
  });

  if (!currentUser) {
    next(
      new AppError('The token is invalid or expired. Please try again!', 400),
    );
    return;
  }

  // 2. If the user is existed, and the reset token has not been expired, update new password
  if (req.body.password !== req.body.passwordConfirm) {
    return next(
      new AppError(
        'The password confirm is not match the provided password! Please try again!',
        400,
      ),
    );
  }
  // update new password
  currentUser.password = req.body.password;
  currentUser.passwordConfirm = req.body.passwordConfirm;
  currentUser.passwordResetToken = undefined;
  currentUser.passwordResetTokenExpiration = undefined;

  await currentUser.save();

  // 3. Send JWT to log in
  sendToken(currentUser, 200, res);
});

const updatePassword = catchAsync(async (req, res, next) => {
  // 1. get user from the collection
  const currentUser = await User.findById(req.user.id).select('+password');

  // 2. check if POSTed password is correct
  if (
    !(await currentUser.correctPassword(
      req.body.oldPassword,
      currentUser.password,
    ))
  ) {
    return next(
      new AppError(
        'The input current password is incorrect! Please try again.',
        400,
      ),
    );
  }
 
  // 3. if so, update the password
  currentUser.password = req.body.newPassword;
  currentUser.passwordConfirm = req.body.newPasswordConfirm;
  await currentUser.save();

  // 4. send JWT
  sendToken(currentUser, 200, res);
});

export {
  signUp,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
};
