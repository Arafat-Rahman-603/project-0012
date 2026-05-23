const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { protect, restrictTo } = require("../middleware/auth");
const { uploadBannerImages } = require("../config/cloudinary");

router.get("/", settingsController.getSettings);
router.put(
  "/",
  protect,
  restrictTo("admin"),
  uploadBannerImages,
  settingsController.updateSettings,
);

module.exports = router;
