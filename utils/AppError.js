class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true;
  }

  static badRequest(message = "Bad request") {
    return new AppError(message, 400);
  }
  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401);
  }
  static forbidden(message = "Forbidden") {
    return new AppError(message, 403);
  }
  static notFound(message = "Not found") {
    return new AppError(message, 404);
  }
  static conflict(message = "Conflict") {
    return new AppError(message, 409);
  }
  static internal(message = "Internal server error") {
    return new AppError(message, 500);
  }
}

module.exports = AppError;
