const express = require("express");
const router  = express.Router();

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

// Specific paths must come before the generic /:id route to avoid shadowing
router.get("/stats/summary",  getStatsSummary);
router.get("/report/:range",  getReport);

router.get("/",               getTasks);
router.post("/",              createTask);
router.delete("/",            deleteAllTasks);

router.get("/:id",            getTaskById);
router.put("/:id",            updateTask);
router.delete("/:id",         deleteTask);

router.patch("/:id/status",   updateStatus);

module.exports = router;
