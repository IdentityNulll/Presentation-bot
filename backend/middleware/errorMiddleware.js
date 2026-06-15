const logger = require('../utils/logger');

function errorMiddleware(err, req, res, next) {
  logger.error('Unhandled request error: %O', err);

  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: {
      message,
      status
    }
  });
}

module.exports = errorMiddleware;
