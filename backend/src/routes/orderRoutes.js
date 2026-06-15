const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { protect, restrictTo, requireEmailVerified } = require("../middleware/auth");
const { uploadOrderNoteImage } = require("../config/cloudinary");

// ── Static / prefix routes MUST come before /:id ──────────────────────────────

// User routes
router.post("/", protect, uploadOrderNoteImage, orderController.createOrder);
router.get("/my", protect, orderController.getMyOrders);

// Admin routes (must be before /:id to avoid "admin" being treated as an ID)
router.get("/admin/stats", protect, restrictTo("admin"), orderController.getDashboardStats);
router.get("/", protect, restrictTo("admin"), orderController.getAllOrders);

// ── Dynamic /:id routes ────────────────────────────────────────────────────────
router.get("/:id", protect, orderController.getOrder);
router.put("/:id/cancel", protect, orderController.cancelOrder);
router.put("/:id/status", protect, restrictTo("admin"), orderController.updateOrderStatus);

module.exports = router;
