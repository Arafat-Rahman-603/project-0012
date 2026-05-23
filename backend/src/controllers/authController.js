const crypto = require("crypto");
const User = require("../models/User");
const { sendTokenResponse, generateAccessToken, verifyRefreshToken, generateRefreshToken } = require("../utils/jwt");
const {
  sendVerificationCodeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} = require("../utils/email");

// @desc    Register new user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    const user = new User({ name, email, password, authProvider: "local" });
    const code = user.generateEmailVerificationCode();
    await user.save();

    try {
      await sendVerificationCodeEmail(user, code);
    } catch (emailErr) {
      console.error("Email send failed:", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Registration successful! Enter the 6-digit code sent to your email.",
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification token." });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, "Email verified successfully! You are now logged in.");
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified." });
    }

    const code = user.generateEmailVerificationCode();
    await user.save();
    await sendVerificationCodeEmail(user, code);

    res.json({ success: true, message: "Verification code sent. Please check your inbox." });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email with 6-digit code
// @route   POST /api/auth/verify-email-code
exports.verifyEmailCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: "Email and verification code are required." });
    }

    const hashedCode = crypto.createHash("sha256").update(String(code).trim()).digest("hex");
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      emailVerificationToken: hashedCode,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code." });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, "Email verified successfully! You are now logged in.");
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Your account has been deactivated." });
    }

    user.lastLogin = new Date();
    await user.save();

    sendTokenResponse(user, 200, res, "Logged in successfully.");
  } catch (error) {
    next(error);
  }
};

// @desc    Create or promote admin (development only)
// @route   POST /api/auth/bootstrap-admin
exports.bootstrapAdmin = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ success: false, message: "Not found." });
    }

    const { email, password, name = "LUXE Admin" } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalized = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalized }).select("+password");

    if (user) {
      user.role = "admin";
      user.isEmailVerified = true;
      user.password = password;
      await user.save();
    } else {
      user = await User.create({
        name,
        email: normalized,
        password,
        role: "admin",
        isEmailVerified: true,
        authProvider: "local",
      });
    }

    res.json({
      success: true,
      message: "Admin account is ready.",
      email: normalized,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = (req, res) => {
  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json({ success: true, message: "Logged out successfully." });
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: "Refresh token not found." });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    const newAccessToken = generateAccessToken(user._id);
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired refresh token." });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email });

    // Always respond the same to prevent email enumeration
    const successMsg = "If an account exists with this email, a reset link has been sent.";

    if (!user || user.authProvider === "google") {
      return res.json({ success: true, message: successMsg });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    try {
      await sendPasswordResetEmail(user, resetToken);
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return next(new Error("Email could not be sent. Please try again."));
    }

    res.json({ success: true, message: successMsg });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    try {
      await sendPasswordChangedEmail(user);
    } catch (_) {}

    sendTokenResponse(user, 200, res, "Password reset successfully.");
  } catch (error) {
    next(error);
  }
};

// @desc    Change password (authenticated)
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new passwords are required." });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }

    user.password = newPassword;
    await user.save();

    try {
      await sendPasswordChangedEmail(user);
    } catch (_) {}

    res.json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth callback handler
// @route   (called after passport success)
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;
    user.lastLogin = new Date();
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };
    res
      .cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
      .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

    const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").split(",")[0].trim();
    const params = new URLSearchParams({
      accessToken,
      refreshToken,
    });
    res.redirect(`${clientUrl}/auth/callback?${params.toString()}`);
  } catch (error) {
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:3000").split(",")[0].trim();
    res.redirect(`${clientUrl}/login?error=google_auth_failed`);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
