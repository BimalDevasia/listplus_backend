const express = require("express");
const router = express.Router();
const {storeUserData, getProfile, updateProfile, deleteProfile } = require("../controllers/authControllers");
const {authenticate} = require("../middleware/auth");  


router.post("/store-user", storeUserData);
router.get("/", authenticate, getProfile);
router.patch("/", authenticate, updateProfile);
router.delete("/", authenticate, deleteProfile);

module.exports = router;