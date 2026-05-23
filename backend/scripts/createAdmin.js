/**
 * Create or promote an admin user.
 * Usage: node scripts/createAdmin.js
 * Optional env: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");

const email = (process.env.ADMIN_EMAIL || "admin@luxe.store").toLowerCase();
const password = process.env.ADMIN_PASSWORD || "Admin@123";
const name = process.env.ADMIN_NAME || "LUXE Admin";

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  let user = await User.findOne({ email }).select("+password");

  if (user) {
    user.role = "admin";
    user.isEmailVerified = true;
    if (password) {
      user.password = password;
    }
    await user.save();
    console.log("Updated existing user to admin:");
  } else {
    user = await User.create({
      name,
      email,
      password,
      role: "admin",
      isEmailVerified: true,
      authProvider: "local",
    });
    console.log("Created new admin user:");
  }

  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log("\nSign in at http://localhost:3001/login");

  await mongoose.disconnect();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
