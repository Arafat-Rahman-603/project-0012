const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validateRegister, validateLogin } = require("../validators");
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  message: { success: false, message: "Too many attempts. Please try again in 15 minutes." },
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: "Too many email requests. Please try again later." },
});

// Local auth
router.post("/register", authLimiter, validateRegister, authController.register);
router.post("/login", authLimiter, validateLogin, authController.login);
router.post("/bootstrap-admin", authController.bootstrapAdmin);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);

// Email verification
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/verify-email-code", authLimiter, authController.verifyEmailCode);
router.post("/resend-verification", emailLimiter, authController.resendVerification);

// Password reset
router.post("/forgot-password", emailLimiter, authController.forgotPassword);
router.put("/reset-password/:token", authLimiter, authController.resetPassword);

// Change password (authenticated)
router.put("/change-password", protect, authController.changePassword);

// Get current user
router.get("/me", protect, authController.getMe);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
    session: false,
  }),
  authController.googleCallback
);

module.exports = router;
