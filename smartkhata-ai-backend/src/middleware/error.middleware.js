const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found.';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(' ');
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate record already exists.';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = {
  errorHandler,
  notFound,
};
