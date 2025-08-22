const express = require("express");
const router = express.Router();
const { getShopItems, addShopItems, updateShopItem, deleteShopItem } = require("../controllers/shopItemsControllers");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
router.get("/:id", getShopItems);
router.post("/:id", addShopItems);
router.patch("/:shopId/:itemId", updateShopItem);
router.delete("/:shopId/:itemId", deleteShopItem);

module.exports = router;
