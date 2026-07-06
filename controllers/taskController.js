const Task = require("../models/Task");

/* ---------------------------------------------------------------------
   Helpers
   --------------------------------------------------------------------- */

// Standard error responder so every controller returns a consistent shape
function sendError(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function computeStats(list) {
  const total = list.length;
  const completed = list.filter((t) => t.status === "Completed").length;
  const pending = list.filter((t) => t.status === "Pending").length;
  const inProgress = list.filter((t) => t.status === "In Progress").length;
  const rate = total ? Math.round((completed / total) * 100) : 0;
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
exports.getTasks = async (req, res) => {
  try {
    const { employee, priority, status, search } = req.query;
    const query = {};

    if (employee) query.employeeName = employee;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [
        { title: regex },
        { employeeName: regex },
        { projectName: regex },
        { description: regex }
      ];
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// GET /api/tasks/:id
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return sendError(res, 404, "Task not found");
    res.json({ success: true, data: task });
  } catch (err) {
    sendError(res, 400, "Invalid task id");
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { employeeName, title, description, startDate, deadline, startTime, endTime } = req.body;
    if (!employeeName || !title || !description || !startDate || !deadline || !startTime || !endTime) {
      return sendError(res, 400, "employeeName, title, description, startDate, deadline, startTime and endTime are required");
    }
    if (new Date(deadline) < new Date(startDate)) {
      return sendError(res, 400, "Deadline cannot be earlier than the start date");
    }
    if (startDate === deadline && endTime <= startTime) {
      return sendError(res, 400, "End time must be after start time");
    }

    const task = await Task.create(req.body);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

// PUT /api/tasks/:id  — full update (used by the edit form)
exports.updateTask = async (req, res) => {
  try {
    const { startDate, deadline, startTime, endTime } = req.body;
    if (startDate && deadline && new Date(deadline) < new Date(startDate)) {
      return sendError(res, 400, "Deadline cannot be earlier than the start date");
    }
    if (startDate && deadline && startTime && endTime && startDate === deadline && endTime <= startTime) {
      return sendError(res, 400, "End time must be after start time");
    }

    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!task) return sendError(res, 404, "Task not found");
    res.json({ success: true, data: task });
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

// PATCH /api/tasks/:id/status  — quick status-only update
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "In Progress", "Completed"].includes(status)) {
      return sendError(res, 400, "Invalid status value");
    }
    const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!task) return sendError(res, 404, "Task not found");
    res.json({ success: true, data: task });
  } catch (err) {
    sendError(res, 400, err.message);
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return sendError(res, 404, "Task not found");
    res.json({ success: true, data: task });
  } catch (err) {
    sendError(res, 400, "Invalid task id");
  }
};

// DELETE /api/tasks  — clear all (used by the "Clear All Data" sidebar action)
exports.deleteAllTasks = async (req, res) => {
  try {
    const result = await Task.deleteMany({});
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// GET /api/tasks/stats/summary  — dashboard stat cards + completion ring
exports.getStatsSummary = async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.json({ success: true, data: computeStats(tasks) });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// GET /api/tasks/report/:range  — range = "daily" | "weekly"
exports.getReport = async (req, res) => {
  try {
    const range = req.params.range === "weekly" ? "weekly" : "daily";
    const { start, end } = getRangeBounds(range);

    // A task is "in range" if its active window (start date → deadline)
    // overlaps the report period at all.
    const tasks = await Task.find({});
    const inRange = tasks.filter((t) => {
      const s = new Date(t.startDate + "T00:00:00");
      const d = new Date(t.deadline + "T00:00:00");
      return s <= end && d >= start;
    });

    res.json({
      success: true,
      range,
      rangeStart: start,
      rangeEnd: end,
      stats: computeStats(inRange),
      data: inRange
    });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};
