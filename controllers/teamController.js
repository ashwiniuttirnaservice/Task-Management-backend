const TeamMember = require("../models/TeamMember");

function sendError(res, status, message) {
  return res.status(status).json({ success: false, message });
}

// GET /api/team — employee -> assigned projects (object shape used across the dashboard)
exports.getTeam = async (req, res) => {
  try {
    const members = await TeamMember.find({}).sort({ name: 1 });
    const data = {};
    members.forEach((m) => {
      data[m.name] = m.projects;
    });
    res.json({ success: true, data });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// GET /api/team/list — array with ids, for the add/edit/delete UI
exports.getTeamList = async (req, res) => {
  try {
    const members = await TeamMember.find({}).sort({ name: 1 });
    res.json({ success: true, data: members });
  } catch (err) {
    sendError(res, 500, err.message);
  }
};

// POST /api/team
exports.createMember = async (req, res) => {
  try {
    const { name, projects } = req.body;
    if (!name) return sendError(res, 400, "Employee name is required");

    const member = await TeamMember.create({ name, projects: projects || [] });
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 400, "An employee with this name already exists");
    sendError(res, 400, err.message);
  }
};

// PUT /api/team/:id
exports.updateMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!member) return sendError(res, 404, "Team member not found");
    res.json({ success: true, data: member });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 400, "An employee with this name already exists");
    sendError(res, 400, err.message);
  }
};

// DELETE /api/team/:id
exports.deleteMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);
    if (!member) return sendError(res, 404, "Team member not found");
    res.json({ success: true, data: member });
  } catch (err) {
    sendError(res, 400, "Invalid team member id");
  }
};
