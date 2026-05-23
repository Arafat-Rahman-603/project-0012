const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { protect, restrictTo } = require("../middleware/auth");
const { uploadProductImages } = require("../config/cloudinary");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");

const categoryImageStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "ecommerce/categories", allowed_formats: ["jpg", "jpeg", "png", "webp"] },
});
const uploadCategoryImage = multer({ storage: categoryImageStorage }).single("image");

// Public
router.get("/", categoryController.getCategories);
router.post("/seed", categoryController.seedCategories);
router.get("/:slug", categoryController.getCategory);

// Admin
router.post("/", protect, restrictTo("admin"), uploadCategoryImage, categoryController.createCategory);
router.put("/:id", protect, restrictTo("admin"), uploadCategoryImage, categoryController.updateCategory);
router.delete("/:id", protect, restrictTo("admin"), categoryController.deleteCategory);

module.exports = router;
