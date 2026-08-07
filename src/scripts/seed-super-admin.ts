import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import { User } from "../models/user.model";
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URL;

const seedSuperAdmin = async () => {
  if (!MONGO_URI) {
    console.error("MONGODB_URL is not defined");
    process.exit(1);
  }

  await connectDB(MONGO_URI);

  const phone = "9999999999";
  const email = "superadmin@dailysales.com";
  const password = "SuperPassword123";

  // Check if super admin already exists
  const existing = await User.findOne({ role: "super_admin" });
  if (existing) {
    console.log("Super Admin user already exists:", existing.phone);
    await mongoose.disconnect();
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);

  const superAdmin = await User.create({
    name: "Platform Super Admin",
    phone,
    email,
    role: "super_admin",
    auth_provider: "password",
    password_hash,
    is_active: true,
  });

  console.log("Super Admin seeded successfully!");
  console.log("Phone:", phone);
  console.log("Email:", email);
  console.log("Password:", password);

  await mongoose.disconnect();
};

seedSuperAdmin().catch((err) => {
  console.error("Failed to seed super admin:", err);
  process.exit(1);
});
