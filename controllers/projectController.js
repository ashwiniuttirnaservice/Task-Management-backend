const Project      = require("../models/Project");
const TeamMember   = require("../models/TeamMember");
const AppError     = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/response");
const STATUS       = require("../utils/statusCodes");
const validate     = require("../utils/validate");
const { isValidObjectId } = require("mongoose");
const { createProjectSchema, updateProjectSchema } = require("../validators/schemas");
const emailService = require("../services/emailService");

const MEMBER_FIELDS = "name workingEmail _id";

// GET /api/projects
exports.getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find().sort({ name: 1 }).populate("members", MEMBER_FIELDS);
  sendResponse(res, STATUS.OK, "Projects fetched", { data: { projects }, metadata: { count: projects.length } });
});

// GET /api/projects/:id
exports.getProjectById = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw AppError.badRequest("Invalid project ID");
  const project = await Project.findById(req.params.id).populate("members", MEMBER_FIELDS);
  if (!project) throw AppError.notFound("Project not found");
  sendResponse(res, STATUS.OK, "Project fetched", { data: { project } });
});

// POST /api/projects
exports.createProject = asyncHandler(async (req, res) => {
  const payload = validate(createProjectSchema, req.body);
  const project = await (await Project.create(payload)).populate("members", MEMBER_FIELDS);
  sendResponse(res, STATUS.CREATED, "Project created", { data: { project } });
  // notify all assigned members (fire-and-forget)
  for (const member of project.members) {
    emailService.sendProjectAssignedEmail({ name: member.name, workingEmail: member.workingEmail, projectName: project.name });
  }
});

// PUT /api/projects/:id
exports.updateProject = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw AppError.badRequest("Invalid project ID");
  const payload = validate(updateProjectSchema, req.body);
  const before  = await Project.findById(req.params.id);
  if (!before) throw AppError.notFound("Project not found");
  const project = await Project.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).populate("members", MEMBER_FIELDS);
  sendResponse(res, STATUS.OK, "Project updated", { data: { project } });
  // notify only newly added members (fire-and-forget)
  if (payload.members) {
    const beforeIds = before.members.map((id) => id.toString());
    const added = project.members.filter((m) => !beforeIds.includes(m._id.toString()));
    for (const member of added) {
      emailService.sendProjectAssignedEmail({ name: member.name, workingEmail: member.workingEmail, projectName: project.name });
    }
  }
});

// DELETE /api/projects/:id
exports.deleteProject = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw AppError.badRequest("Invalid project ID");
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) throw AppError.notFound("Project not found");
  sendResponse(res, STATUS.OK, "Project deleted");
});
