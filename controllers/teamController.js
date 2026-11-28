const mongoose     = require("mongoose");
const TeamMember   = require("../models/TeamMember");
const AppError     = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/response");
const STATUS       = require("../utils/statusCodes");
const validate     = require("../utils/validate");
const emailService = require("../services/emailService");
const {
  createMemberSchema,
  updateMemberSchema,
} = require("../validators/schemas");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

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
  const data = validate(createMemberSchema, req.body);
  const member = await TeamMember.create(data).catch((err) => {
    if (err.code === 11000) throw AppError.conflict("An employee with this name already exists");
    throw err;
  });
  sendResponse(res, STATUS.CREATED, "Member created", { data: { member } });
  // fire-and-forget — don't block response
  emailService.sendWelcomeEmail({ name: member.name, workingEmail: member.workingEmail });
});

// PUT /api/team/:id
exports.updateMember = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw AppError.badRequest("Invalid team member id");
  const data = validate(updateMemberSchema, req.body);

  const before = await TeamMember.findById(req.params.id);
  if (!before) throw AppError.notFound("Team member not found");

  const member = await TeamMember.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  }).catch((err) => {
    if (err.code === 11000) throw AppError.conflict("An employee with this name already exists");
    throw err;
  });

  sendResponse(res, STATUS.OK, "Member updated", { data: { member } });

  // notify for newly added projects (fire-and-forget)
  if (data.projects && member.workingEmail) {
    const added = data.projects.filter((p) => !before.projects.includes(p));
    added.forEach((projectName) =>
      emailService.sendProjectAssignedEmail({ name: member.name, workingEmail: member.workingEmail, projectName })
    );
  }
});

// DELETE /api/team/:id
exports.deleteMember = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw AppError.badRequest("Invalid team member id");
  const member = await TeamMember.findByIdAndDelete(req.params.id);
  if (!member) throw AppError.notFound("Team member not found");
  sendResponse(res, STATUS.OK, "Member deleted", { data: { member } });
});
