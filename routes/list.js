const express = require("express");
const router = express.Router();
const {
    getLists,
    addList,
    getOneList,
    updateList,
    deleteList,
    addMemberToList,
    removeMemberFromList,
    generateInviteLink,
    joinListByInvite
} = require("../controllers/listcontollers");
const {authenticate} = require("../middleware/auth");


router.use(authenticate); // All routes in this router are protected
router.get("/", getLists);
router.get("/:id", getOneList);
router.post("/", addList);
router.patch("/:id", updateList);
router.delete("/:id", deleteList);
router.post("/:listId/members", addMemberToList);
router.delete("/:listId/members/:memberId", removeMemberFromList);
router.post("/:listId/invite", generateInviteLink);
router.post("/join/:inviteCode", joinListByInvite);

module.exports = router;