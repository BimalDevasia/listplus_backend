const express = require("express");
const router = express.Router();
const { getGroupItems, getCancelledGroupItems, addGroupItems, updateGroupItem, deleteGroupItem } = require("../controllers/groupItemsControllers");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
router.get("/:id", getGroupItems);
router.get("/:id/cancelled", getCancelledGroupItems);
router.post("/:id", addGroupItems);
router.patch("/:groupId/:itemId", updateGroupItem);
router.delete("/:groupId/:itemId", deleteGroupItem);

module.exports = router;
