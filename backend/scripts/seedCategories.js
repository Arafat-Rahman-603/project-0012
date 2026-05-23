/**
 * Seed default product categories.
 * Usage: node scripts/seedCategories.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../src/models/Category");

const DEFAULT_CATEGORIES = [
  { name: "Watches", description: "Luxury timepieces" },
  { name: "Bags", description: "Handbags and leather goods" },
  { name: "Accessories", description: "Belts, wallets, and more" },
  { name: "Fragrances", description: "Premium perfumes" },
  { name: "Jewelry", description: "Rings, necklaces, and bracelets" },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const cat of DEFAULT_CATEGORIES) {
    const exists = await Category.findOne({ name: cat.name });
    if (!exists) {
      await Category.create(cat);
      console.log(`  + ${cat.name}`);
    } else {
      console.log(`  = ${cat.name} (exists)`);
    }
  }

  const total = await Category.countDocuments({ isActive: true });
  console.log(`\n${total} active categor${total === 1 ? "y" : "ies"} ready.`);

  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
