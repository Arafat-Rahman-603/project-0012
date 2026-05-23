const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, restrictTo } = require("../middleware/auth");
const { uploadAvatar } = require("../config/cloudinary");

// Profile
router.get("/profile", protect, userController.getProfile);
router.put("/profile", protect, userController.updateProfile);
router.put("/avatar", protect, uploadAvatar, userController.uploadAvatar);

// Wishlist
router.post("/wishlist/:productId", protect, userController.toggleWishlist);

// Addresses
router.post("/addresses", protect, userController.addAddress);
router.put("/addresses/:addressId", protect, userController.updateAddress);
router.delete("/addresses/:addressId", protect, userController.deleteAddress);

// Admin routes
router.get("/", protect, restrictTo("admin"), userController.getAllUsers);
router.get("/:id/details", protect, restrictTo("admin"), userController.getUserDetails);
router.put("/:id", protect, restrictTo("admin"), userController.updateUser);
router.delete("/:id", protect, restrictTo("admin"), userController.deleteUser);

module.exports = router;
