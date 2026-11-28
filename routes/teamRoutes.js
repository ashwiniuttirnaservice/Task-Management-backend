const express = require("express");
const router  = express.Router();

const {
  getTeam,
  getTeamList,
  createMember,
  updateMember,
  deleteMember,
} = require("../controllers/teamController");

// Specific paths must come before the generic /:id route
router.get("/list",    getTeamList);

router.get("/",        getTeam);
router.post("/",       createMember);

router.put("/:id",     updateMember);
router.delete("/:id",  deleteMember);

module.exports = router;
