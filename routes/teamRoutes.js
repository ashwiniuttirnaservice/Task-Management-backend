const express = require("express");
const router = express.Router();
const {
  getTeam,
  getTeamList,
  createMember,
  updateMember,
  deleteMember
} = require("../controllers/teamController");

router.get("/", getTeam);
router.get("/list", getTeamList);
router.post("/", createMember);
router.put("/:id", updateMember);
router.delete("/:id", deleteMember);

module.exports = router;
