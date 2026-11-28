const mongoose     = require("mongoose");
const TeamMember   = require("../models/TeamMember");
const Project      = require("../models/Project");
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

/** Build a memberId → [{_id, name, key}] map from all projects. */
async function buildProjectsByMember() {
  const projects = await Project.find({}, "_id name key members");
  const map = {};
  for (const p of projects) {
    for (const mId of p.members) {
      const key = mId.toString();
      if (!map[key]) map[key] = [];
      map[key].push({ _id: p._id, name: p.name, key: p.key });
    }
  }
  return map;
}

/**
 * Set project membership for a member.
 * newProjectIds = desired full set of project _ids (strings).
 * Adds member to newly listed projects, removes from dropped ones.
 */
async function syncMemberProjects(memberId, newProjectIds = []) {
  const memberObjId = new mongoose.Types.ObjectId(memberId);
  const newSet  = newProjectIds.map((id) => id.toString());

  // current projects for this member
  const current = await Project.find({ members: memberObjId }, "_id");
  const currentSet = current.map((p) => p._id.toString());

  const toAdd    = newSet.filter((id) => !currentSet.includes(id));
  const toRemove = currentSet.filter((id) => !newSet.includes(id));

  const ops = [];
  if (toAdd.length)
    ops.push(Project.updateMany({ _id: { $in: toAdd }    }, { $addToSet: { members: memberObjId } }));
  if (toRemove.length)
    ops.push(Project.updateMany({ _id: { $in: toRemove } }, { $pull:     { members: memberObjId } }));

  await Promise.all(ops);
  return { toAdd, toRemove };
}

// GET /api/team — { name → [projectName, ...] } map (used by task dropdowns)
exports.getTeam = asyncHandler(async (req, res) => {
  const [members, projectsByMember] = await Promise.all([
    TeamMember.find({}).sort({ name: 1 }),
    buildProjectsByMember(),
  ]);
  const team = {};
  for (const m of members) {
    team[m.name] = (projectsByMember[m._id.toString()] ?? []).map((p) => p.name);
  }
  sendResponse(res, STATUS.OK, "Team fetched", { data: { team } });
});

// GET /api/team/list — full member array with their projects attached
exports.getTeamList = asyncHandler(async (req, res) => {
  const [members, projectsByMember] = await Promise.all([
    TeamMember.find({}).sort({ name: 1 }),
    buildProjectsByMember(),
  ]);
  const result = members.map((m) => ({
    ...m.toObject(),
    projects: projectsByMember[m._id.toString()] ?? [],
  }));
  sendResponse(res, STATUS.OK, "Team list fetched", { data: { members: result } });
});

// POST /api/team
exports.createMember = asyncHandler(async (req, res) => {
  const { projects: projectIds = [], ...memberData } = validate(createMemberSchema, req.body);

  const member = await TeamMember.create(memberData).catch((err) => {
    if (err.code === 11000) throw AppError.conflict("An employee with this name already exists");
    throw err;
  });

  // assign member to selected projects
  if (projectIds.length) {
    await syncMemberProjects(member._id, projectIds);
    // notify (fire-and-forget)
    const projects = await Project.find({ _id: { $in: projectIds } }, "name");
    for (const p of projects) {
      emailService.sendProjectAssignedEmail({ name: member.name, workingEmail: member.workingEmail, projectName: p.name });
    }
  }

  sendResponse(res, STATUS.CREATED, "Member created", { data: { member } });
  emailService.sendWelcomeEmail({ name: member.name, workingEmail: member.workingEmail });
});

// PUT /api/team/:id
exports.updateMember = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw AppError.badRequest("Invalid team member id");
  const { projects: projectIds, ...memberData } = validate(updateMemberSchema, req.body);

  const member = await TeamMember.findByIdAndUpdate(req.params.id, memberData, {
    new: true, runValidators: true,
  }).catch((err) => {
    if (err.code === 11000) throw AppError.conflict("An employee with this name already exists");
    throw err;
  });
  if (!member) throw AppError.notFound("Team member not found");

  // sync project membership if projects list was sent
  if (Array.isArray(projectIds)) {
    const { toAdd } = await syncMemberProjects(member._id, projectIds);
    // notify only newly added projects (fire-and-forget)
    if (toAdd.length && member.workingEmail) {
      const projects = await Project.find({ _id: { $in: toAdd } }, "name");
      for (const p of projects) {
        emailService.sendProjectAssignedEmail({ name: member.name, workingEmail: member.workingEmail, projectName: p.name });
      }
    }
  }

  sendResponse(res, STATUS.OK, "Member updated", { data: { member } });
});

// DELETE /api/team/:id
exports.deleteMember = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw AppError.badRequest("Invalid team member id");
  const member = await TeamMember.findByIdAndDelete(req.params.id);
  if (!member) throw AppError.notFound("Team member not found");
  // remove from all projects
  await Project.updateMany({ members: member._id }, { $pull: { members: member._id } });
  sendResponse(res, STATUS.OK, "Member deleted", { data: { member } });
});
