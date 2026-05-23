const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { protect, restrictTo, requireEmailVerified } = require("../middleware/auth");
const { uploadProductImages, uploadReviewImage } = require("../config/cloudinary");
const { validateProduct } = require("../validators");

// Public
router.get("/", productController.getProducts);
router.get("/:id", productController.getProduct);

// Reviews (authenticated, email verified)
router.post(
  "/:id/reviews",
  protect,
  requireEmailVerified,
  uploadReviewImage,
  productController.addReview
);
router.delete("/:id/reviews/:reviewId", protect, productController.deleteReview);

// Admin only
router.post(
  "/",
  protect,
  restrictTo("admin"),
  uploadProductImages,
  validateProduct,
  productController.createProduct
);

router.put(
  "/:id",
  protect,
  restrictTo("admin"),
  uploadProductImages,
  productController.updateProduct
);

router.delete("/:id", protect, restrictTo("admin"), productController.deleteProduct);

module.exports = router;
