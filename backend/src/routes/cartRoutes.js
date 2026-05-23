// cartRoutes.js
const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { protect } = require("../middleware/auth");

router.get("/", protect, cartController.getCart);
router.post("/", protect, cartController.addToCart);
router.put("/:itemId", protect, cartController.updateCartItem);
router.delete("/", protect, cartController.clearCart);
router.delete("/:itemId", protect, cartController.removeFromCart);

module.exports = router;
