const SiteSettings = require("../models/SiteSettings");
const { deleteImage } = require("../config/cloudinary");

const DEFAULT_SETTINGS = {
  singletonKey: "site",
  siteName: "Next Shop",
  heroTitle: "Authentic Jerseys & Premium Streetwear",
  heroSubtitle: "Explore the latest club and international kits, match-day player editions, and modern streetwear with nationwide express Cash-on-Delivery across all 64 districts in Bangladesh.",
  heroCtaText: "Shop Collection",
  heroCtaHref: "/products",
  banners: [],
  logo: { url: "", publicId: "" },
  contactPhone: "+880 1700-000000",
  contactEmail: "support@nextshop.com.bd",
  contactAddress: "House 12, Road 5, Banani, Dhaka, Bangladesh",
  facebookUrl: "https://facebook.com",
  instagramUrl: "https://instagram.com",
  whatsappNumber: "+8801700000000",
  announcementText: "⚡ New Season Football Kits & Premium Streetwear Dropped! Cash-on-Delivery Across Bangladesh",
  showAnnouncement: true,
  announcementBg: "#D97706",
  announcementColor: "#FFFFFF",
  courierSettings: {
    steadfast: { apiKey: "", secretKey: "", isActive: false },
    pathao: { clientId: "", clientSecret: "", username: "", password: "", storeId: "", isActive: false },
    defaultProvider: "steadfast",
  },
  shippingSettings: {
    freeShippingThreshold: 2000,
    standardDeliveryFee: 80,
  },
  bkashSettings: {
    merchantNumber: "01700000000",
    accountType: "Merchant",
    advanceDiscountPercentage: 30,
    minAdvanceAmount: 100,
    isActive: true,
  },
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
        title: typeof banner.title === "string" ? banner.title.trim() : "",
        subtitle: typeof banner.subtitle === "string" ? banner.subtitle.trim() : "",
        ctaText: typeof banner.ctaText === "string" ? banner.ctaText.trim() : "Shop Now",
        ctaHref: typeof banner.ctaHref === "string" ? banner.ctaHref.trim() : "/products",
        textColor: typeof banner.textColor === "string" ? banner.textColor.trim() : "#F8F6F0",
        buttonBg: typeof banner.buttonBg === "string" ? banner.buttonBg.trim() : "#D97706",
        buttonColor: typeof banner.buttonColor === "string" ? banner.buttonColor.trim() : "#0A0A0A",
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

    const newBannersMetadata = req.body.newBanners ? JSON.parse(req.body.newBanners) : [];
    const uploadedBanners = (req.files?.bannerImages || []).map((file, index) => {
      const meta = newBannersMetadata[index] || {};
      return {
        url: file.path,
        publicId: file.filename,
        title: typeof meta.title === "string" ? meta.title.trim() : "",
        subtitle: typeof meta.subtitle === "string" ? meta.subtitle.trim() : "",
        ctaText: typeof meta.ctaText === "string" ? meta.ctaText.trim() : "Shop Now",
        ctaHref: typeof meta.ctaHref === "string" ? meta.ctaHref.trim() : "/products",
        textColor: typeof meta.textColor === "string" ? meta.textColor.trim() : "#F8F6F0",
        buttonBg: typeof meta.buttonBg === "string" ? meta.buttonBg.trim() : "#D97706",
        buttonColor: typeof meta.buttonColor === "string" ? meta.buttonColor.trim() : "#0A0A0A",
      };
    });

    const nextSiteName = (req.body.siteName || "").trim();
    if (!nextSiteName) {
      return res.status(400).json({
        success: false,
        message: "Site name is required.",
      });
    }

    // Handle logo upload/deletion
    let logo = currentSettings.logo || { url: "", publicId: "" };
    if (req.files?.logoImage?.[0]) {
      if (currentSettings.logo?.publicId) {
        await deleteImage(currentSettings.logo.publicId);
      }
      logo = {
        url: req.files.logoImage[0].path,
        publicId: req.files.logoImage[0].filename,
      };
    } else if (req.body.removeLogo === "true") {
      if (currentSettings.logo?.publicId) {
        await deleteImage(currentSettings.logo.publicId);
      }
      logo = { url: "", publicId: "" };
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

    let courierSettings = currentSettings.courierSettings;
    if (req.body.courierSettings) {
      try {
        const parsed = typeof req.body.courierSettings === "string" ? JSON.parse(req.body.courierSettings) : req.body.courierSettings;
        courierSettings = {
          ...courierSettings,
          ...parsed,
          steadfast: { ...(courierSettings?.steadfast || {}), ...(parsed.steadfast || {}) },
          pathao: { ...(courierSettings?.pathao || {}), ...(parsed.pathao || {}) },
        };
      } catch (_) {}
    }

    let shippingSettings = currentSettings.shippingSettings || DEFAULT_SETTINGS.shippingSettings;
    if (req.body.shippingSettings) {
      try {
        const parsed = typeof req.body.shippingSettings === "string" ? JSON.parse(req.body.shippingSettings) : req.body.shippingSettings;
        shippingSettings = { ...shippingSettings, ...parsed };
      } catch (_) {}
    }

    let bkashSettings = currentSettings.bkashSettings || DEFAULT_SETTINGS.bkashSettings;
    if (req.body.bkashSettings) {
      try {
        const parsed = typeof req.body.bkashSettings === "string" ? JSON.parse(req.body.bkashSettings) : req.body.bkashSettings;
        bkashSettings = { ...bkashSettings, ...parsed };
      } catch (_) {}
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
          logo,
          contactPhone: (req.body.contactPhone || "").trim(),
          contactEmail: (req.body.contactEmail || "").trim(),
          contactAddress: (req.body.contactAddress || "").trim(),
          facebookUrl: (req.body.facebookUrl || "").trim(),
          instagramUrl: (req.body.instagramUrl || "").trim(),
          whatsappNumber: (req.body.whatsappNumber || "").trim(),
          announcementText: (req.body.announcementText || "").trim(),
          showAnnouncement: req.body.showAnnouncement === "true",
          announcementBg: (req.body.announcementBg || "").trim() || DEFAULT_SETTINGS.announcementBg,
          announcementColor: (req.body.announcementColor || "").trim() || DEFAULT_SETTINGS.announcementColor,
          courierSettings,
          shippingSettings,
          bkashSettings,
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
