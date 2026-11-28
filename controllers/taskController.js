const mongoose    = require("mongoose");
const Task         = require("../models/Task");
const AppError     = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/response");
const STATUS       = require("../utils/statusCodes");
const validate     = require("../utils/validate");
const emailService = require("../services/emailService");
const TeamMember   = require("../models/TeamMember");
const {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  taskQuerySchema,
} = require("../validators/schemas");

/* ---------------------------------------------------------------------
   Helpers
   --------------------------------------------------------------------- */

function computeStats(list) {
  const total      = list.length;
  const completed  = list.filter((t) => t.status === "Completed").length;
  const pending    = list.filter((t) => t.status === "Pending").length;
  const inProgress = list.filter((t) => t.status === "In Progress").length;
  const rate       = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, pending, inProgress, rate };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getRangeBounds(range) {
  const today = startOfToday();
  let start;
  if (range === "weekly") {
    start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); // Sunday of this week
  } else {
    start = new Date(today); // daily
  }
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/* ---------------------------------------------------------------------
   Controllers
   --------------------------------------------------------------------- */

// GET /api/tasks  — supports optional ?employee=&priority=&status=&search=
exports.getTasks = asyncHandler(async (req, res) => {
  const { member, project, priority, status, search } = validate(taskQuerySchema, req.query);
  const query = {};

  if (member)   query.assignedMembers = new mongoose.Types.ObjectId(member);
  if (project)  query.projectName = project;
  if (priority) query.priority = priority;
  if (status)   query.status = status;
  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [
      { title: regex },
      { projectName: regex },
      { description: regex },
    ];
  }

  const tasks = await Task.find(query)
    .populate("assignedMembers", "name position _id")
    .sort({ createdAt: -1 });
  sendResponse(res, STATUS.OK, "Tasks fetched", {
    data:     { tasks },
    metadata: { count: tasks.length },
  });
});

// GET /api/tasks/:id
exports.getTaskById = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw AppError.badRequest("Invalid task id");
  const task = await Task.findById(req.params.id).populate("assignedMembers", "name position _id");
  if (!task) throw AppError.notFound("Task not found");
  sendResponse(res, STATUS.OK, "Task fetched", { data: { task } });
});

// POST /api/tasks
exports.createTask = asyncHandler(async (req, res) => {
  const data = validate(createTaskSchema, req.body);
  const task = await Task.create(data);
  const populated = await task.populate("assignedMembers", "name workingEmail _id");
  sendResponse(res, STATUS.CREATED, "Task created", { data: { task: populated } });
  // fire-and-forget — notify all assigned members
  (populated.assignedMembers || []).forEach((member) => {
    if (member?.workingEmail) {
      emailService.sendTaskAssignedEmail({
        employeeName: member.name,
        workingEmail: member.workingEmail,
        taskTitle:    data.title,
        deadline:     data.deadline,
      });
    }
  });
});

// PUT /api/tasks/:id  — full update (used by the edit form)
exports.updateTask = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw AppError.badRequest("Invalid task id");
  const data = validate(updateTaskSchema, req.body);
  const task = await Task.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
    .populate("assignedMembers", "name position _id");
  if (!task) throw AppError.notFound("Task not found");
  sendResponse(res, STATUS.OK, "Task updated", { data: { task } });
});

// PATCH /api/tasks/:id/status  — quick status-only update
exports.updateStatus = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw AppError.badRequest("Invalid task id");
  const { status } = validate(updateStatusSchema, req.body);
  const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!task) throw AppError.notFound("Task not found");
  sendResponse(res, STATUS.OK, "Status updated", { data: { task } });
});

// DELETE /api/tasks/:id
exports.deleteTask = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw AppError.badRequest("Invalid task id");
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw AppError.notFound("Task not found");
  sendResponse(res, STATUS.OK, "Task deleted", { data: { task } });
});

// DELETE /api/tasks  — clear all (used by the "Clear All Data" sidebar action)
exports.deleteAllTasks = asyncHandler(async (req, res) => {
  const result = await Task.deleteMany({});
  sendResponse(res, STATUS.OK, "All tasks deleted", {
    metadata: { deletedCount: result.deletedCount },
  });
});

// GET /api/tasks/stats/summary  — dashboard stat cards + completion ring
exports.getStatsSummary = asyncHandler(async (req, res) => {
  const tasks = await Task.find({});
  sendResponse(res, STATUS.OK, "Stats fetched", {
    data: { stats: computeStats(tasks) },
  });
});

// GET /api/tasks/report/:range  — range = "daily" | "weekly"
exports.getReport = asyncHandler(async (req, res) => {
  const range = req.params.range === "weekly" ? "weekly" : "daily";
  const { start, end } = getRangeBounds(range);

  const tasks = await Task.find({});
  const inRange = tasks.filter((t) => {
    const s = new Date(t.startDate + "T00:00:00");
    const d = new Date(t.deadline + "T00:00:00");
    return s <= end && d >= start;
  });

  sendResponse(res, STATUS.OK, "Report fetched", {
    data:     { tasks: inRange, stats: computeStats(inRange) },
    metadata: { range, rangeStart: start, rangeEnd: end },
  });
});
