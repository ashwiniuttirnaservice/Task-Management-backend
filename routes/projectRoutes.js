const express  = require("express");
const router   = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const admin = requireRole("admin");

router.use(protect);

router.get("/",    getProjects);
router.get("/:id", getProjectById);

router.post("/",    admin, createProject);
router.put("/:id",  admin, updateProject);
router.delete("/:id", admin, deleteProject);

module.exports = router;
