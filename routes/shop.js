const express = require("express");
const router = express.Router();
const {
    getShops,
    addShop,
    getOneShop,
    updateShop,
    deleteShop,
    getFavouriteShops,
    addToFavourites,
    removeFromFavourites
} = require("../controllers/shopControllers");
const {authenticate} = require("../middleware/auth");

router.use(authenticate); // All routes in this router are protected

// Shop CRUD routes
router.get("/", getShops);
router.get("/:id", getOneShop);
router.post("/", addShop);
router.patch("/:id", updateShop);
router.delete("/:id", deleteShop);

// Favourites routes
router.get("/favourites/list", getFavouriteShops);
router.post("/favourites", addToFavourites);
router.delete("/favourites/:shopId", removeFromFavourites);

module.exports = router;
