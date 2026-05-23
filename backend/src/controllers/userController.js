const User = require("../models/User");
const Order = require("../models/Order");
const { deleteImage } = require("../config/cloudinary");
const { successResponse, paginatedResponse } = require("../utils/response");

// @desc    Get user profile
// @route   GET /api/users/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist", "name price images slug");
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: "Profile updated.", user });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload/update avatar
// @route   PUT /api/users/avatar
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }

    const user = await User.findById(req.user._id);

    // Delete old avatar from cloudinary
    if (user.avatarPublicId) {
      await deleteImage(user.avatarPublicId);
    }

    user.avatar = req.file.path;
    user.avatarPublicId = req.file.filename;
    await user.save();

    res.json({ success: true, message: "Avatar updated.", avatar: user.avatar });
  } catch (error) {
    next(error);
  }
};

// @desc    Add/update shipping address
// @route   POST /api/users/addresses
exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const addressData = req.body;

    if (addressData.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    if (!user.addresses.length) {
      addressData.isDefault = true;
    }

    user.addresses.push(addressData);
    await user.save();

    res.status(201).json({ success: true, message: "Address added.", addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Update address
// @route   PUT /api/users/addresses/:addressId
exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    if (req.body.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    Object.assign(address, req.body);
    await user.save();

    res.json({ success: true, message: "Address updated.", addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete address
// @route   DELETE /api/users/addresses/:addressId
exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    address.deleteOne();
    await user.save();

    res.json({ success: true, message: "Address deleted.", addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle product in wishlist
// @route   POST /api/users/wishlist/:productId
exports.toggleWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;
    const idx = user.wishlist.findIndex((id) => id.toString() === productId);

    let message;
    if (idx > -1) {
      user.wishlist.splice(idx, 1);
      message = "Removed from wishlist.";
    } else {
      user.wishlist.push(productId);
      message = "Added to wishlist.";
    }

    await user.save();
    res.json({ success: true, message, wishlist: user.wishlist });
  } catch (error) {
    next(error);
  }
};

// =================== ADMIN ===================

// @desc    Get all users (admin)
// @route   GET /api/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search;

    const filter = {};
    if (search) filter.$or = [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).sort("-createdAt"),
      User.countDocuments(filter),
    ]);

    paginatedResponse(res, users, total, page, limit);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user details (admin)
// @route   GET /api/users/:id/details
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("+phone");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const orders = await Order.find({ user: user._id });

    const totalOrders = orders.length;
    const cancelledOrders = orders.filter((o) => o.orderStatus === "cancelled").length;
    const totalBill = orders
      .filter((o) => o.orderStatus !== "cancelled" && o.orderStatus !== "refunded")
      .reduce((sum, o) => sum + o.totalPrice, 0);

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      stats: {
        totalOrders,
        cancelledOrders,
        totalBill,
      },
      orders: orders.map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        totalPrice: o.totalPrice,
        orderStatus: o.orderStatus,
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role/status (admin)
// @route   PUT /api/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...(role && { role }), ...(isActive !== undefined && { isActive }) },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    res.json({ success: true, message: "User updated.", user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, message: "User deleted." });
  } catch (error) {
    next(error);
  }
};
