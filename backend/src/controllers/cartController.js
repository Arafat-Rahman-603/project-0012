const Cart = require("../models/Cart");
const Product = require("../models/Product");

const PRODUCT_FIELDS = "name images price discountPrice stock isActive slug brand";

const formatCart = (cart) => {
  if (!cart) {
    return { _id: null, items: [], subtotal: 0, totalPrice: 0, totalItems: 0 };
  }

  const items = (cart.items ?? []).map((item) => ({
    _id: item._id,
    product: item.product,
    quantity: item.quantity,
    price: item.price,
  }));

  const subtotal =
    items.reduce((sum, item) => sum + item.price * item.quantity, 0) -
    (cart.discount || 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    _id: cart._id,
    items,
    subtotal,
    totalPrice: subtotal,
    totalItems,
  };
};

const populateCart = (cart) =>
  cart.populate({ path: "items.product", select: PRODUCT_FIELDS });

const getOrCreateCart = async (userId) => {
  if (!userId) {
    throw new Error("User id is required for cart.");
  }

  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [], discount: 0, coupon: null } },
    { new: true, upsert: true }
  );

  return cart;
};

// @desc    Get cart
// @route   GET /api/cart
exports.getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    await populateCart(cart);
    res.json({ success: true, data: formatCart(cart) });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required." });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (product.stock < qty) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock.` });
    }

    const cart = await getOrCreateCart(req.user._id);
    const existingItem = cart.items.find((i) => i.product.toString() === productId);
    const price = product.discountPrice > 0 ? product.discountPrice : product.price;

    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock.` });
      }
      existingItem.quantity = newQty;
      existingItem.price = price;
    } else {
      cart.items.push({ product: productId, quantity: qty, price });
    }

    await cart.save();
    await populateCart(cart);

    res.json({
      success: true,
      message: "Item added to cart.",
      data: formatCart(cart),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1." });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found." });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found in cart." });

    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product no longer available." });
    }

    const qty = parseInt(quantity, 10);
    if (qty > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} items in stock.` });
    }

    item.quantity = qty;
    await cart.save();
    await populateCart(cart);

    res.json({ success: true, message: "Cart updated.", data: formatCart(cart) });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
exports.removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found." });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found in cart." });

    item.deleteOne();
    await cart.save();
    await populateCart(cart);

    res.json({
      success: true,
      message: "Item removed from cart.",
      data: formatCart(cart),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [], discount: 0, coupon: null },
      { new: true }
    );
    res.json({
      success: true,
      message: "Cart cleared.",
      data: formatCart(cart || { items: [], discount: 0 }),
    });
  } catch (error) {
    next(error);
  }
};
