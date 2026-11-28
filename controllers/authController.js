const jwt        = require("jsonwebtoken");
const TeamMember = require("../models/TeamMember");
const AppError   = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/response");
const STATUS     = require("../utils/statusCodes");

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw AppError.badRequest("Email and password are required");

  const user = await TeamMember.findOne({ workingEmail: email }).select("+password");
  if (!user || !user.password || !(await user.comparePassword(password))) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const token = signToken(user._id);
  res.cookie("token", token, COOKIE_OPTS);

  const { password: _, ...userData } = user.toObject();
  sendResponse(res, STATUS.OK, "Logged in", { data: { user: userData } });
});

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  sendResponse(res, STATUS.OK, "Logged out");
};

// GET /api/auth/me  — returns current user from cookie
exports.me = asyncHandler(async (req, res) => {
  sendResponse(res, STATUS.OK, "Authenticated", { data: { user: req.user } });
});
