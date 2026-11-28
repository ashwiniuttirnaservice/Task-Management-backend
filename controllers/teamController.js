const TeamMember   = require("../models/TeamMember");
const AppError     = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/response");
const STATUS       = require("../utils/statusCodes");

// GET /api/team — employee -> assigned projects (object shape used across the dashboard)
exports.getTeam = asyncHandler(async (req, res) => {
  const members = await TeamMember.find({}).sort({ name: 1 });
  const team = {};
  members.forEach((m) => { team[m.name] = m.projects; });
  sendResponse(res, STATUS.OK, "Team fetched", { data: { team } });
});

// GET /api/team/list — array with ids, for the add/edit/delete UI
exports.getTeamList = asyncHandler(async (req, res) => {
  const members = await TeamMember.find({}).sort({ name: 1 });
  sendResponse(res, STATUS.OK, "Team list fetched", { data: { members } });
});

// POST /api/team
exports.createMember = asyncHandler(async (req, res) => {
  const { name, projects } = req.body;
  if (!name) throw AppError.badRequest("Employee name is required");

  const member = await TeamMember.create({ name, projects: projects || [] }).catch((err) => {
    if (err.code === 11000) throw AppError.conflict("An employee with this name already exists");
    throw err;
  });
  sendResponse(res, STATUS.CREATED, "Member created", { data: { member } });
});

// PUT /api/team/:id
exports.updateMember = asyncHandler(async (req, res) => {
  const member = await TeamMember.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).catch((err) => {
    if (err.code === 11000) throw AppError.conflict("An employee with this name already exists");
    throw err;
  });
  if (!member) throw AppError.notFound("Team member not found");
  sendResponse(res, STATUS.OK, "Member updated", { data: { member } });
});

// DELETE /api/team/:id
exports.deleteMember = asyncHandler(async (req, res) => {
  const member = await TeamMember.findByIdAndDelete(req.params.id).catch(() => {
    throw AppError.badRequest("Invalid team member id");
  });
  if (!member) throw AppError.notFound("Team member not found");
  sendResponse(res, STATUS.OK, "Member deleted", { data: { member } });
});
