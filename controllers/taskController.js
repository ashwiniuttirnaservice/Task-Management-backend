const Task         = require("../models/Task");
const AppError     = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/response");
const STATUS       = require("../utils/statusCodes");

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

/* ---------------------------------------------------------------------
   Controllers
   --------------------------------------------------------------------- */

// GET /api/tasks  — supports optional ?employee=&priority=&status=&search=
exports.getTasks = asyncHandler(async (req, res) => {
  const { employee, priority, status, search } = req.query;
  const query = {};

  if (employee) query.employeeName = employee;
  if (priority) query.priority = priority;
  if (status)   query.status = status;
  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [
      { title: regex },
      { employeeName: regex },
      { projectName: regex },
      { description: regex },
    ];
  }

  const tasks = await Task.find(query).sort({ createdAt: -1 });
  sendResponse(res, STATUS.OK, "Tasks fetched", {
    data:     { tasks },
    metadata: { count: tasks.length },
  });
});

// GET /api/tasks/:id
exports.getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).catch(() => {
    throw AppError.badRequest("Invalid task id");
  });
  if (!task) throw AppError.notFound("Task not found");
  sendResponse(res, STATUS.OK, "Task fetched", { data: { task } });
});

// POST /api/tasks
exports.createTask = asyncHandler(async (req, res) => {
  const { employeeName, title, description, startDate, deadline, startTime, endTime } = req.body;

  if (!employeeName || !title || !description || !startDate || !deadline || !startTime || !endTime) {
    throw AppError.badRequest("employeeName, title, description, startDate, deadline, startTime and endTime are required");
  }
  if (new Date(deadline) < new Date(startDate)) {
    throw AppError.badRequest("Deadline cannot be earlier than the start date");
  }
  if (startDate === deadline && endTime <= startTime) {
    throw AppError.badRequest("End time must be after start time");
  }

  const task = await Task.create(req.body);
  sendResponse(res, STATUS.CREATED, "Task created", { data: { task } });
});

// PUT /api/tasks/:id  — full update (used by the edit form)
exports.updateTask = asyncHandler(async (req, res) => {
  const { startDate, deadline, startTime, endTime } = req.body;

  if (startDate && deadline && new Date(deadline) < new Date(startDate)) {
    throw AppError.badRequest("Deadline cannot be earlier than the start date");
  }
  if (startDate && deadline && startTime && endTime && startDate === deadline && endTime <= startTime) {
    throw AppError.badRequest("End time must be after start time");
  }

  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!task) throw AppError.notFound("Task not found");
  sendResponse(res, STATUS.OK, "Task updated", { data: { task } });
});

// PATCH /api/tasks/:id/status  — quick status-only update
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Pending", "In Progress", "Completed"].includes(status)) {
    throw AppError.badRequest("Invalid status value");
  }
  const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!task) throw AppError.notFound("Task not found");
  sendResponse(res, STATUS.OK, "Status updated", { data: { task } });
});

// DELETE /api/tasks/:id
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id).catch(() => {
    throw AppError.badRequest("Invalid task id");
  });
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
