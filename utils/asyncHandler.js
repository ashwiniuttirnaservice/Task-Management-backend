/**
 * Wraps an async Express route handler and forwards any thrown error
 * to Express's next() so the global error handler catches it.
 * Eliminates the try/catch boilerplate in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
