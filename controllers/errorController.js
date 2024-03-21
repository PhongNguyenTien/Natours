import AppError from '../utils/appError.js';

const handleCastErrorDB = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

const handleDuplicatedFieldDB = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  return new AppError(
    `Duplicated field: ${value}! Please input other value!`,
    400,
  );
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors)
    .map((el) => el.message)
    .join('. ');
  return new AppError(`Invalid input data. ${errors}`, 400);
};

const handleJWTError = (err) => {
  return new AppError('Invalid token! Please log in again!', 401);
};

const handleExpiredJWT = (err) => {
  return new AppError('The token has expired! Please log in again!', 401);
};

const sendErrorDev = (err, res) => {
  // in development environment: send as much as details for the error.
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  // when the error is operational, send the status and message; 
  // if not, send the simple other status and message that discuss the server error (programming error, etc.)
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // if not the operational error (progamming error/server error)
  } else {
    // don't not want to leak the message to the client (friendly response).
    res.status(500).json({
      status: 'error',
      message: 'Something is very wrong!',
      error: err,
    });
  }
};

const generalHandleError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err);

    // handle invalid ID from client
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }

    // handle duplicated field from client
    if (error.code === 11000) {
      error = handleDuplicatedFieldDB(error);
    }

    // handle validation error
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }

    // handle wrong JWT error
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError(error);
    }

    // handle expired token
    if (error.name === 'TokenExpiredError') {
      error = handleExpiredJWT(error);
    }
    sendErrorProd(error, res);
  }
  next();
};

export default generalHandleError;
