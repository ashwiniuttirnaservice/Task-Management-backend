const express  = require("express");
const router   = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");

const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateStatus,
  deleteTask,
  deleteAllTasks,
  getStatsSummary,
  getReport,
} = require("../controllers/taskController");

const admin = requireRole("admin");

// All task routes require authentication
router.use(protect);

// Read — all authenticated users
router.get("/stats/summary",  getStatsSummary);
router.get("/report/:range",  getReport);
router.get("/",               getTasks);
router.get("/:id",            getTaskById);

// Status update — all authenticated (employees update their own task status)
router.patch("/:id/status",   updateStatus);

// Writes — admin only
router.post("/",              admin, createTask);
router.delete("/",            admin, deleteAllTasks);
router.put("/:id",            admin, updateTask);
router.delete("/:id",         admin, deleteTask);

module.exports = router;
