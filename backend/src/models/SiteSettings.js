const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: "" },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    ctaText: { type: String, default: "Shop Now" },
    ctaHref: { type: String, default: "/products" },
    textColor: { type: String, default: "#F8F6F0" },
    buttonBg: { type: String, default: "#D97706" },
    buttonColor: { type: String, default: "#0A0A0A" },
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
      default: "",
    },
    heroSubtitle: {
      type: String,
      trim: true,
      default: "",
    },
    heroCtaText: {
      type: String,
      trim: true,
      default: "Shop Now",
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
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    contactPhone: {
      type: String,
      default: "",
    },
    contactEmail: {
      type: String,
      default: "",
    },
    contactAddress: {
      type: String,
      default: "",
    },
    facebookUrl: {
      type: String,
      default: "",
    },
    instagramUrl: {
      type: String,
      default: "",
    },
    whatsappNumber: {
      type: String,
      default: "",
    },
    announcementText: {
      type: String,
      default: "",
    },
    showAnnouncement: {
      type: Boolean,
      default: false,
    },
    announcementBg: {
      type: String,
      default: "#D97706",
    },
    announcementColor: {
      type: String,
      default: "#FFFFFF",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
