const Product = require("../models/Product");
const { deleteImage } = require("../config/cloudinary");
const { paginatedResponse } = require("../utils/response");

// @desc    Get all products (with filtering, search, pagination)
// @route   GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      sort = "-createdAt",
      brand,
      featured,
      inStock,
    } = req.query;

    const filter = { isActive: true };
    if (search) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: regex },
        { description: regex },
        { brand: regex },
        { tags: regex },
      ];
    }
    if (category) filter.category = category;
    if (brand) filter.brand = new RegExp(brand, "i");
    if (featured === "true" || featured === true) filter.isFeatured = true;
    if (inStock === "true" || inStock === true) filter.stock = { $gt: 0 };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .select("-reviews")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    paginatedResponse(res, products, total, page, limit);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const query = req.params.id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.id }
      : { slug: req.params.id };

    const product = await Product.findOne({
      ...query,
      isActive: true,
    }).populate("category", "name slug");

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product (admin)
// @route   POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };
    if (
      productData.isFeatured === undefined &&
      productData.featured !== undefined
    ) {
      productData.isFeatured = productData.featured;
    }

    productData.price = parseFloat(productData.price);
    productData.stock = parseInt(productData.stock, 10);
    if (productData.discountPrice) {
      productData.discountPrice = parseFloat(productData.discountPrice);
    }
    productData.isFeatured =
      productData.isFeatured === "true" || productData.isFeatured === true;
    productData.isActive =
      productData.isActive === undefined ||
      productData.isActive === "true" ||
      productData.isActive === true;

    // Parse sizes: accept JSON array string or comma-separated string
    if (productData.sizes !== undefined) {
      if (typeof productData.sizes === "string") {
        try {
          productData.sizes = JSON.parse(productData.sizes);
        } catch (_) {
          productData.sizes = productData.sizes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
    }

    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
    }

    const product = await Product.create(productData);
    await product.populate("category", "name slug");

    res
      .status(201)
      .json({ success: true, message: "Product created.", product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (admin)
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    const updates = { ...req.body };
    if (updates.isFeatured === undefined && updates.featured !== undefined) {
      updates.isFeatured = updates.featured;
    }

    if (req.files && req.files.length > 0) {
      // Delete old images from cloudinary
      for (const img of product.images) {
        await deleteImage(img.publicId);
      }
      updates.images = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
    }

    if (updates.isFeatured !== undefined) {
      updates.isFeatured =
        updates.isFeatured === "true" || updates.isFeatured === true;
    }

    if (updates.isActive !== undefined) {
      updates.isActive =
        updates.isActive === "true" || updates.isActive === true;
    }

    // Parse sizes: accept JSON array string or comma-separated string
    if (updates.sizes !== undefined) {
      if (typeof updates.sizes === "string") {
        try {
          updates.sizes = JSON.parse(updates.sizes);
        } catch (_) {
          updates.sizes = updates.sizes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("category", "name slug");

    res.json({ success: true, message: "Product updated.", product: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (admin)
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    // Delete images from cloudinary
    for (const img of product.images) {
      await deleteImage(img.publicId);
    }

    await product.deleteOne();
    res.json({ success: true, message: "Product deleted." });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product review
// @route   POST /api/products/:id/reviews
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res
        .status(400)
        .json({ success: false, message: "Rating and comment are required." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString(),
    );
    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }

    const reviewData = {
      user: req.user._id,
      name: req.user.name,
      avatar: req.user.avatar,
      rating: parseInt(rating),
      comment,
    };

    if (req.file) {
      reviewData.image = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    product.reviews.push(reviewData);

    product.updateRating();
    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added.",
      reviews: product.reviews,
      rating: product.rating,
      numReviews: product.numReviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/products/:id/reviews/:reviewId
exports.deleteReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });

    const review = product.reviews.id(req.params.reviewId);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found." });

    // User can delete own review, admin can delete any
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review.",
      });
    }

    // Delete review image if exists
    if (review.image && review.image.publicId) {
      await deleteImage(review.image.publicId);
    }

    review.deleteOne();
    product.updateRating();
    await product.save();

    res.json({ success: true, message: "Review deleted." });
  } catch (error) {
    next(error);
  }
};
