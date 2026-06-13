const SiteSettings = require("../models/SiteSettings");
const { deleteImage } = require("../config/cloudinary");

const DEFAULT_SETTINGS = {
  singletonKey: "site",
  siteName: "Next Shop",
  heroTitle: "Timeless Sarees for Every Celebration",
  heroSubtitle:
    "Discover elegant silk, jamdani, katan, and festive sarees curated for modern women.",
  heroCtaText: "Shop Sarees",
  heroCtaHref: "/products",
  banners: [],
};

const ensureSettings = async () =>
  SiteSettings.findOneAndUpdate(
    { singletonKey: "site" },
    { $setOnInsert: DEFAULT_SETTINGS },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

const parseExistingBanners = (value) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((banner) => banner && typeof banner.url === "string")
      .map((banner) => ({
        url: banner.url.trim(),
        publicId: typeof banner.publicId === "string" ? banner.publicId : "",
      }))
      .filter((banner) => banner.url);
  } catch (_) {
    return [];
  }
};

// @desc    Get site settings
// @route   GET /api/settings
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await ensureSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Update site settings
// @route   PUT /api/settings
exports.updateSettings = async (req, res, next) => {
  try {
    const currentSettings = await ensureSettings();
    const existingBanners = parseExistingBanners(req.body.existingBanners);
    const uploadedBanners = (req.files || []).map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    const nextSiteName = (req.body.siteName || "").trim();
    if (!nextSiteName) {
      return res.status(400).json({
        success: false,
        message: "Site name is required.",
      });
    }

    const keptPublicIds = new Set(
      existingBanners.map((banner) => banner.publicId).filter(Boolean)
    );

    const removedBanners = currentSettings.banners.filter(
      (banner) => banner.publicId && !keptPublicIds.has(banner.publicId)
    );

    for (const banner of removedBanners) {
      await deleteImage(banner.publicId);
    }

    const settings = await SiteSettings.findOneAndUpdate(
      { singletonKey: "site" },
      {
        $set: {
          siteName: nextSiteName,
          heroTitle: (req.body.heroTitle || "").trim() || DEFAULT_SETTINGS.heroTitle,
          heroSubtitle:
            (req.body.heroSubtitle || "").trim() || DEFAULT_SETTINGS.heroSubtitle,
          heroCtaText:
            (req.body.heroCtaText || "").trim() || DEFAULT_SETTINGS.heroCtaText,
          heroCtaHref:
            (req.body.heroCtaHref || "").trim() || DEFAULT_SETTINGS.heroCtaHref,
          banners: [...existingBanners, ...uploadedBanners],
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: "Site settings updated successfully.",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
