const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: "" },
  },
  { _id: true }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: "site",
      unique: true,
      immutable: true,
    },
    siteName: {
      type: String,
      required: true,
      trim: true,
      default: "Next Shop",
    },
    heroTitle: {
      type: String,
      trim: true,
      default: "Timeless Sarees for Every Celebration",
    },
    heroSubtitle: {
      type: String,
      trim: true,
      default: "Discover elegant silk, jamdani, katan, and festive sarees curated for modern women.",
    },
    heroCtaText: {
      type: String,
      trim: true,
      default: "Shop Sarees",
    },
    heroCtaHref: {
      type: String,
      trim: true,
      default: "/products",
    },
    banners: {
      type: [bannerSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
