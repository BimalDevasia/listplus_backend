const express = require("express");
const router = express.Router();
const {
    getGroups,
    addGroup,
    getOneGroup,
    updateGroup,
    deleteGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    generateInviteLink,
    joinGroupByInvite
} = require("../controllers/groupControllers");
const {authenticate} = require("../middleware/auth");

router.use(authenticate); // All routes in this router are protected
router.get("/", getGroups);
router.get("/:id", getOneGroup);
router.post("/", addGroup);
router.patch("/:id", updateGroup);
router.delete("/:id", deleteGroup);
router.post("/:groupId/members", addMemberToGroup);
router.delete("/:groupId/members/:memberId", removeMemberFromGroup);
router.post("/:groupId/invite", generateInviteLink);
router.post("/join/:inviteCode", joinGroupByInvite);

module.exports = router;
