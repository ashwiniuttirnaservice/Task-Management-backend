const jwt      = require("jsonwebtoken");
const TeamMember = require("../models/TeamMember");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

/** Verifies the httpOnly cookie and attaches req.user. */
const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) throw AppError.unauthorized("Not authenticated");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw AppError.unauthorized("Session expired — please log in again");
  }

  const user = await TeamMember.findById(payload.id);
  if (!user) throw AppError.unauthorized("User no longer exists");

  req.user = user;
  next();
});

/** Restricts to one or more roles — must come after protect. */
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    throw AppError.forbidden(`Access denied — requires role: ${roles.join(" or ")}`);
  }
  next();
};

module.exports = { protect, requireRole };
