const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { protect, restrictTo, requireEmailVerified } = require("../middleware/auth");

// User routes
router.post("/", protect, requireEmailVerified, orderController.createOrder);
router.get("/my", protect, orderController.getMyOrders);
router.get("/:id", protect, orderController.getOrder);
router.put("/:id/cancel", protect, orderController.cancelOrder);

// Admin routes
router.get("/", protect, restrictTo("admin"), orderController.getAllOrders);
router.get("/admin/stats", protect, restrictTo("admin"), orderController.getDashboardStats);
router.put("/:id/status", protect, restrictTo("admin"), orderController.updateOrderStatus);

module.exports = router;
