const express  = require("express");
const router   = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");

const {
  getTeam,
  getTeamList,
  getMe,
  createMember,
  updateMember,
  deleteMember,
} = require("../controllers/teamController");

const admin = requireRole("admin");

// All team routes require authentication
router.use(protect);

// Read — all authenticated users
router.get("/me",      getMe);
router.get("/list",    getTeamList);
router.get("/",        getTeam);

// Writes — admin only
router.post("/",       admin, createMember);
router.put("/:id",     admin, updateMember);
router.delete("/:id",  admin, deleteMember);

module.exports = router;
