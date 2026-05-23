const Category = require("../models/Category");
const { deleteImage } = require("../config/cloudinary");

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).populate("parent", "name slug").sort("name");
    res.json({ success: true, categories });
  } catch (error) { next(error); }
};

exports.seedCategories = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ success: false, message: "Not found." });
    }

    const defaults = [
      { name: "Watches", description: "Luxury timepieces" },
      { name: "Bags", description: "Handbags and leather goods" },
      { name: "Accessories", description: "Belts, wallets, and more" },
      { name: "Fragrances", description: "Premium perfumes" },
      { name: "Jewelry", description: "Rings, necklaces, and bracelets" },
    ];

    const created = [];
    for (const cat of defaults) {
      const exists = await Category.findOne({ name: cat.name });
      if (!exists) {
        created.push(await Category.create(cat));
      }
    }

    const categories = await Category.find({ isActive: true }).sort("name");

    res.json({
      success: true,
      message: created.length
        ? `Added ${created.length} categories.`
        : "Categories already exist.",
      categories,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategory = async (req, res, next) => {
  try {
    const cat = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!cat) return res.status(404).json({ success: false, message: "Category not found." });
    res.json({ success: true, category: cat });
  } catch (error) { next(error); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.image = { url: req.file.path, publicId: req.file.filename };
    const category = await Category.create(data);
    res.status(201).json({ success: true, message: "Category created.", category });
  } catch (error) { next(error); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });

    const data = { ...req.body };
    if (req.file) {
      if (category.image?.publicId) await deleteImage(category.image.publicId);
      data.image = { url: req.file.path, publicId: req.file.filename };
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json({ success: true, message: "Category updated.", category: updated });
  } catch (error) { next(error); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    if (category.image?.publicId) await deleteImage(category.image.publicId);
    await category.deleteOne();
    res.json({ success: true, message: "Category deleted." });
  } catch (error) { next(error); }
};
