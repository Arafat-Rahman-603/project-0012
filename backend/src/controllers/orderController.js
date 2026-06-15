const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const { sendOrderConfirmationEmail } = require("../utils/email");
const { paginatedResponse } = require("../utils/response");

// @desc    Create order from cart
// @route   POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod = "cod", notes } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: "Shipping address is required." });
    }

    if (paymentMethod !== "cod") {
      return res.status(400).json({
        success: false,
        message: "Only Cash on Delivery (COD) is available at this time.",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    // Validate stock
    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        return res.status(400).json({ success: false, message: `Product "${item.product?.name}" is no longer available.` });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${item.product.stock} units of "${item.product.name}" available.`,
        });
      }
    }

    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images[0]?.url || "",
      price: item.price,
      quantity: item.quantity,
    }));

    const itemsPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) - cart.discount;
    const shippingPrice = itemsPrice > 1000 ? 0 : 60; // Free shipping over 1000 BDT
    const taxPrice = 0;
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    // Deduct stock atomically before creating order (prevents overselling)
    const stockUpdates = [];
    for (const item of cart.items) {
      const updated = await Product.findOneAndUpdate(
        {
          _id: item.product._id,
          isActive: true,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity, soldCount: item.quantity } },
        { new: true }
      );

      if (!updated) {
        for (const prev of stockUpdates) {
          await Product.findByIdAndUpdate(prev.productId, {
            $inc: { stock: prev.quantity, soldCount: -prev.quantity },
          });
        }
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.product.name}". Please update your cart.`,
        });
      }
      stockUpdates.push({ productId: item.product._id, quantity: item.quantity });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      notes,
      noteImage: req.file
        ? { url: req.file.path, publicId: req.file.filename }
        : undefined,
      orderStatus: "pending",
    });

    // Clear cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], discount: 0, coupon: null });

    // Send confirmation email
    try {
      await sendOrderConfirmationEmail(req.user, order);
    } catch (_) {}

    res.status(201).json({ success: true, message: "Order placed successfully.", order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's orders
// @route   GET /api/orders/my
exports.getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .populate("items.product", "name slug images")
        .sort("-createdAt")
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ user: req.user._id }),
    ]);

    paginatedResponse(res, orders, total, page, limit);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "name slug images");

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (!["pending", "confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: "Order cannot be cancelled at this stage." });
    }

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    order.cancelReason = req.body.reason || "Cancelled by customer";
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, soldCount: -item.quantity },
      });
    }

    res.json({ success: true, message: "Order cancelled.", order });
  } catch (error) {
    next(error);
  }
};

// =================== ADMIN ===================

// @desc    Get all orders (admin)
// @route   GET /api/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter = {};
    if (status) filter.orderStatus = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .populate("items.product", "name slug images")
        .sort("-createdAt")
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    // Revenue stats
    const totalRevenue = await Order.aggregate([
      { $match: { orderStatus: { $nin: ["cancelled", "refunded"] } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    paginatedResponse(res, orders, total, page, limit, "Orders fetched.");
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber } = req.body;
    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "refunded"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const updates = { orderStatus: status };
    if (status === "delivered") updates.deliveredAt = new Date();
    if (trackingNumber) updates.trackingNumber = trackingNumber;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    const previousStatus = order.orderStatus;

    if (status === "cancelled" && !["cancelled", "refunded"].includes(previousStatus)) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, soldCount: -item.quantity },
        });
      }
      updates.cancelledAt = new Date();
    }

    Object.assign(order, updates);
    await order.save();
    await order.populate("user", "name email");

    res.json({ success: true, message: "Order status updated.", order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats (admin)
// @route   GET /api/orders/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const pendingStatuses = ["pending", "confirmed", "processing", "shipped"];

    const [
      totalOrders,
      totalUsers,
      totalProducts,
      deliveredRevenueAgg,
      pendingRevenueAgg,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ isActive: { $ne: false } }),
      Product.countDocuments({ isActive: true }),
      Order.aggregate([
        { $match: { orderStatus: "delivered" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Order.aggregate([
        { $match: { orderStatus: { $in: pendingStatuses } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Order.countDocuments({ orderStatus: { $in: pendingStatuses } }),
      Order.countDocuments({ orderStatus: "delivered" }),
      Order.countDocuments({ orderStatus: "cancelled" }),
    ]);

    const recentOrders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name slug images")
      .sort("-createdAt")
      .limit(8);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalUsers,
        totalProducts,
        deliveredRevenue: deliveredRevenueAgg[0]?.total || 0,
        pendingRevenue: pendingRevenueAgg[0]?.total || 0,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
      },
      recentOrders,
    });
  } catch (error) {
    next(error);
  }
};
