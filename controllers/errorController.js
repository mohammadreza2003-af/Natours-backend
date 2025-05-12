const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  console.log(err);
  const value = err.errorResponse.errmsg.match(/(["'])(.*?)\1/)[0];
  const message = `Duplicate field value: ${value}. please use another value!`;
  return new AppError(message, 400);
};

const handleValidationError = err => {
  const errorFields = Object.values(err.errors).map(e => e.message);
  const message = `Invalid input data. ${errorFields.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTErorr = () =>
  new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredErorr = () =>
  new AppError('Your token has expired. Please log in again!', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    message: err.message,
    status: err.status,
    stack: err.stack,
    error: err
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      message: err.message,
      status: err.status
    });
  } else {
    console.error('Error', err);

    res.status(500).json({
      message: 'Something went very wrong!',
      status: 'fail'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationError(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTErorr();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredErorr();
    sendErrorProd(error, res);
  }
};
