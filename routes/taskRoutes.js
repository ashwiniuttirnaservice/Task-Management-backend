const express = require("express");
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateStatus,
  deleteTask,
  deleteAllTasks,
  getStatsSummary,
  getReport
} = require("../controllers/taskController");

// Specific routes must come before the generic "/:id" route
router.get("/stats/summary", getStatsSummary);
router.get("/report/:range", getReport);

router.route("/")
  .get(getTasks)
  .post(createTask)
  .delete(deleteAllTasks);

router.route("/:id")
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.patch("/:id/status", updateStatus);

module.exports = router;
