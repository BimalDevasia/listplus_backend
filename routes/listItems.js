const express = require("express")
const router = express.Router()
const {authenticate} = require("../middleware/auth")
const {getListItems, addItems, updateItem, deleteItem} = require("../controllers/listItemsControllers")

// All routes protected with authentication
router.use(authenticate);

// Get all items for a list
router.get("/:id", getListItems)

// Add new item to a list
router.post("/:id", addItems)

// Update an item in a list
router.patch("/:listId/:itemId", updateItem)

// Delete an item from a list
router.delete("/:listId/:itemId", deleteItem)

module.exports = router

