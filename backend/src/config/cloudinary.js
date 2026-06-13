const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Product images storage
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ecommerce/products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 800, height: 800, crop: "limit", quality: "auto" },
    ],
  },
});

// Avatar storage
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ecommerce/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 200,
        height: 200,
        crop: "fill",
        gravity: "face",
        quality: "auto",
      },
    ],
  },
});

const uploadProductImages = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).array("images", 5);

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single("avatar");

const heroStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ecommerce/hero",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 1920, height: 1080, crop: "limit", quality: "auto" },
    ],
  },
});

const uploadHeroImage = multer({
  storage: heroStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
}).single("heroImage");

const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ecommerce/banners",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 1920, height: 1080, crop: "limit", quality: "auto" },
    ],
  },
});

const uploadBannerImages = multer({
  storage: bannerStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
}).array("bannerImages", 10);

const uploadSettingsImages = multer({
  storage: bannerStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
}).fields([
  { name: "bannerImages", maxCount: 10 },
  { name: "logoImage", maxCount: 1 },
]);

// Review image storage
const reviewStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ecommerce/reviews",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 800, height: 800, crop: "limit", quality: "auto" },
    ],
  },
});

const uploadReviewImage = multer({
  storage: reviewStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("image");

const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
  }
};

module.exports = {
  cloudinary,
  uploadProductImages,
  uploadAvatar,
  uploadHeroImage,
  uploadBannerImages,
  uploadSettingsImages,
  uploadReviewImage,
  deleteImage,
};
