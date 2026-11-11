const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const SiteSettings = require("../models/SiteSettings");
const { sendOrderConfirmationEmail } = require("../utils/email");
const { paginatedResponse } = require("../utils/response");
const {
  dispatchToSteadfast,
  trackSteadfast,
  dispatchToPathao,
} = require("../utils/courier");

// @desc    Create order from cart
// @route   POST /api/orders
exports.createOrder = async (req, res, next) => {
  const stockUpdates = [];
  try {
    // Parse shipping address (support JSON object, JSON string, or multipart bracket notation)
    let shippingAddress = req.body.shippingAddress;
    if (typeof shippingAddress === "string") {
      try {
        shippingAddress = JSON.parse(shippingAddress);
      } catch (_) {
        shippingAddress = null;
      }
    }

    if (!shippingAddress || typeof shippingAddress !== "object") {
      shippingAddress = {
        fullName:
          req.body["shippingAddress[fullName]"] ||
          req.body["shippingAddress.fullName"] ||
          req.body.fullName ||
          "",
        phone:
          req.body["shippingAddress[phone]"] ||
          req.body["shippingAddress.phone"] ||
          req.body.phone ||
          "",
        addressLine1:
          req.body["shippingAddress[addressLine1]"] ||
          req.body["shippingAddress.addressLine1"] ||
          req.body.addressLine1 ||
          "",
        addressLine2:
          req.body["shippingAddress[addressLine2]"] ||
          req.body["shippingAddress.addressLine2"] ||
          req.body.addressLine2 ||
          "",
        city:
          req.body["shippingAddress[city]"] ||
          req.body["shippingAddress.city"] ||
          req.body.city ||
          "",
        state:
          req.body["shippingAddress[state]"] ||
          req.body["shippingAddress.state"] ||
          req.body.state ||
          "",
        postalCode:
          req.body["shippingAddress[postalCode]"] ||
          req.body["shippingAddress.postalCode"] ||
          req.body.postalCode ||
          "",
        country:
          req.body["shippingAddress[country]"] ||
          req.body["shippingAddress.country"] ||
          req.body.country ||
          "BD",
      };
    }

    const {
      paymentMethod = "cod",
      notes,
      bkashNumber = "",
      bkashTrxId = "",
      advanceAmount: clientAdvanceAmount,
    } = req.body;

    if (
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.addressLine1
    ) {
      return res.status(400).json({ success: false, message: "Shipping address is required." });
    }

    if (!["cod", "bkash"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Only Cash on Delivery (COD) and bKash payments are supported at this time.",
      });
    }

    if (paymentMethod === "bkash" && (!bkashTrxId || !bkashTrxId.trim())) {
      return res.status(400).json({
        success: false,
        message: "bKash Transaction ID (TrxID) is required for advance payment confirmation.",
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

    const rawItemsPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 30% advance discount for bKash payment
    let discountAmount = 0;
    if (paymentMethod === "bkash") {
      discountAmount = Math.round(rawItemsPrice * 0.30);
    }

    const itemsPrice = Math.max(0, rawItemsPrice - discountAmount - (cart.discount || 0));
    const shippingPrice = itemsPrice >= 2000 ? 0 : 80; // Free shipping over 2000 BDT across Bangladesh
    const taxPrice = 0;
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    // Advance amount calculation
    let advanceAmount = 0;
    let dueAmount = totalPrice;
    let paymentStatus = "unpaid";

    if (paymentMethod === "bkash") {
      const parsedAdvance = Number(clientAdvanceAmount) || 100;
      // Minimum ৳100 advance deposit, capped at totalPrice
      advanceAmount = Math.max(100, Math.min(totalPrice, parsedAdvance));
      dueAmount = Math.max(0, totalPrice - advanceAmount);
      paymentStatus = advanceAmount >= totalPrice ? "paid" : "partially_paid";
    }

    // Deduct stock atomically before creating order (prevents overselling)
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
      paymentStatus,
      discountAmount,
      advanceAmount,
      dueAmount,
      bkashNumber: (bkashNumber || "").trim(),
      bkashTrxId: (bkashTrxId || "").trim().toUpperCase(),
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid: paymentStatus === "paid",
      paidAt: paymentStatus === "paid" ? new Date() : undefined,
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
    // Rollback any stock deducted if order creation failed
    for (const prev of stockUpdates) {
      try {
        await Product.findByIdAndUpdate(prev.productId, {
          $inc: { stock: prev.quantity, soldCount: -prev.quantity },
        });
      } catch (_) {}
    }
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

    const isOwner = order.user && order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (["shipped", "delivered", "cancelled", "refunded"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.orderStatus}.`,
      });
    }

    if (order.courier?.trackingCode) {
      return res.status(400).json({
        success: false,
        message: "Order has already been dispatched to courier and cannot be cancelled automatically. Please contact support.",
      });
    }

    if (!["pending", "confirmed", "processing"].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: "Order cannot be cancelled at this stage." });
    }

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    order.cancelReason = req.body.reason || (isAdmin ? "Cancelled by administrator" : "Cancelled by customer");
    await order.save();

    // Restore stock safely
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity, soldCount: -item.quantity },
          });
        }
      }
    }

    res.json({ success: true, message: "Order cancelled successfully.", order });
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

// @desc    Dispatch order to Steadfast or Pathao Courier (admin)
// @route   POST /api/orders/:id/courier/dispatch
exports.dispatchOrderToCourier = async (req, res, next) => {
  try {
    const { provider = "steadfast" } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.orderStatus === "cancelled" || order.orderStatus === "delivered") {
      return res.status(400).json({
        success: false,
        message: `Cannot dispatch order with status "${order.orderStatus}".`,
      });
    }

    // Retrieve settings for credentials
    const settings = await SiteSettings.findOne({ singletonKey: "site" });
    const courierSettings = settings?.courierSettings;

    let result;
    if (provider === "steadfast") {
      result = await dispatchToSteadfast(order, courierSettings?.steadfast);
    } else if (provider === "pathao") {
      result = await dispatchToPathao(order, courierSettings?.pathao);
    } else {
      return res.status(400).json({ success: false, message: "Unsupported courier provider." });
    }

    order.courier = {
      provider: result.provider,
      consignmentId: result.consignmentId,
      trackingCode: result.trackingCode,
      status: result.status,
      dispatchedAt: new Date(),
      lastTrackedAt: new Date(),
    };

    order.trackingNumber = result.trackingCode || result.consignmentId;
    if (order.orderStatus === "pending" || order.orderStatus === "confirmed" || order.orderStatus === "processing") {
      order.orderStatus = "shipped";
    }

    await order.save();
    await order.populate("user", "name email");

    res.json({
      success: true,
      message: `Order dispatched via ${provider.toUpperCase()} successfully.`,
      order,
      courier: order.courier,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track courier delivery status
// @route   GET /api/orders/:id/courier/track
exports.trackCourier = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (!order.courier?.provider || order.courier.provider === "none") {
      return res.status(400).json({
        success: false,
        message: "This order has not been dispatched to a courier yet.",
      });
    }

    const settings = await SiteSettings.findOne({ singletonKey: "site" });
    const courierSettings = settings?.courierSettings;

    let trackingData;
    if (order.courier.provider === "steadfast") {
      const identifier = order.courier.consignmentId || order.orderNumber;
      trackingData = await trackSteadfast(identifier, courierSettings?.steadfast);
      order.courier.status = trackingData.deliveryStatus;
      order.courier.lastTrackedAt = new Date();

      if (trackingData.deliveryStatus === "delivered") {
        order.orderStatus = "delivered";
        order.deliveredAt = order.deliveredAt || new Date();
        order.isPaid = true;
      }
      await order.save();
    }

    res.json({
      success: true,
      courier: order.courier,
      trackingData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Public Order Tracking lookup (no login required)
// @route   GET /api/orders/track/lookup
exports.trackPublicOrder = async (req, res, next) => {
  try {
    const { orderNumber, phone } = req.query;

    if (!orderNumber || !phone) {
      return res.status(400).json({
        success: false,
        message: "Order number and phone number are required.",
      });
    }

    const cleanOrderNumber = String(orderNumber).trim();
    const cleanPhone = String(phone).trim().replace(/[^0-9]/g, "");

    const order = await Order.findOne({
      orderNumber: new RegExp(`^${cleanOrderNumber}$`, "i"),
    })
      .populate("items.product", "name slug images price")
      .select("-__v");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No order found matching the provided order number.",
      });
    }

    // Verify phone matches
    const orderPhone = (order.shippingAddress?.phone || "").replace(/[^0-9]/g, "");
    if (!orderPhone.endsWith(cleanPhone.slice(-10))) {
      return res.status(401).json({
        success: false,
        message: "The phone number does not match this order.",
      });
    }

    res.json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        totalPrice: order.totalPrice,
        itemsPrice: order.itemsPrice,
        shippingPrice: order.shippingPrice,
        discountAmount: order.discountAmount,
        advanceAmount: order.advanceAmount,
        dueAmount: order.dueAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        isPaid: order.isPaid,
        shippingAddress: {
          fullName: order.shippingAddress?.fullName,
          city: order.shippingAddress?.city,
          state: order.shippingAddress?.state,
        },
        items: order.items,
        trackingNumber: order.trackingNumber,
        courier: order.courier,
        deliveredAt: order.deliveredAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order payment status (admin)
// @route   PUT /api/orders/:id/payment-status
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;
    if (!["unpaid", "partially_paid", "paid"].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: "Invalid payment status." });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    order.paymentStatus = paymentStatus;
    if (paymentStatus === "paid") {
      order.isPaid = true;
      order.paidAt = new Date();
      order.dueAmount = 0;
    } else if (paymentStatus === "partially_paid") {
      order.isPaid = false;
    } else {
      order.isPaid = false;
      order.dueAmount = order.totalPrice;
    }

    await order.save();
    res.json({ success: true, message: "Payment status updated.", order });
  } catch (error) {
    next(error);
  }
};
