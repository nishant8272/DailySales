// Worker management — owner adds, lists, and deactivates workers
import { Types } from "mongoose";
import bcrypt from "bcrypt";
import { User } from "../models";
import { HttpError } from "../utils/http-error";

// Create a worker account under the owner's shop
export const createWorker = async (
  shop_id: string,
  input: {
    name: string;
    phone: string;
    password: string;
    email?: string;
  }
) => {
  const shopObjectId = new Types.ObjectId(shop_id);
  const normalizedEmail = input.email?.trim().toLowerCase();

  // Check duplicate phone in same shop
  const existing = await User.findOne({
    shop_id: shopObjectId,
    phone: input.phone,
  });

  if (existing) {
    throw new HttpError(
      409,
      "A user with this phone number already exists in your shop."
    );
  }

  if (normalizedEmail) {
    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      throw new HttpError(409, "Email is already in use.");
    }
  }

  const password_hash = await bcrypt.hash(input.password, 10);

  const worker = await User.create({
    shop_id: shopObjectId,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: normalizedEmail ?? undefined,
    role: "worker",            // always worker — owner account is created at registration
    auth_provider: "password",
    password_hash,
    is_active: true,
  });

  // Return without password_hash
  const { password_hash: _, ...workerData } = worker.toObject();
  return workerData;
};

// List all users (workers + owner) in this shop 
export const getShopUsers = async (shop_id: string) => {
  const users = await User.find({
    shop_id: new Types.ObjectId(shop_id),
  })
    .select("-password_hash")
    .sort({ created_at: 1 });

  return users;
};

// Get single user
export const getUserById = async (user_id: string, shop_id: string) => {
  if (!Types.ObjectId.isValid(user_id)) {
    throw new HttpError(400, "Invalid user ID.");
  }

  const user = await User.findOne({
    _id: new Types.ObjectId(user_id),
    shop_id: new Types.ObjectId(shop_id),
  }).select("-password_hash");

  if (!user) {
    throw new HttpError(404, "User not found.");
  }

  return user;
};

// Update worker details
export const updateWorker = async (
  user_id: string,
  shop_id: string,
  input: { name?: string; phone?: string; email?: string }
) => {
  if (!Types.ObjectId.isValid(user_id)) {
    throw new HttpError(400, "Invalid user ID.");
  }

  const user = await User.findOne({
    _id: new Types.ObjectId(user_id),
    shop_id: new Types.ObjectId(shop_id),
  });

  if (!user) {
    throw new HttpError(404, "User not found.");
  }

  // Check phone duplicate if phone is being changed
  if (input.phone && input.phone.trim() !== user.phone) {
    const duplicate = await User.findOne({
      shop_id: new Types.ObjectId(shop_id),
      phone: input.phone,
      _id: { $ne: new Types.ObjectId(user_id) },
    });
    if (duplicate) {
      throw new HttpError(409, "Phone number already in use.");
    }
  }

  if (input.email !== undefined) {
    const normalizedEmail = input.email.trim().toLowerCase();

    if (normalizedEmail.length > 0) {
      const duplicateEmail = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: new Types.ObjectId(user_id) },
      });

      if (duplicateEmail) {
        throw new HttpError(409, "Email already in use.");
      }
    }
  }

  if (input.name) user.name = input.name.trim();
  if (input.phone) user.phone = input.phone.trim();
  if (input.email !== undefined) {
    const normalizedEmail = input.email.trim().toLowerCase();
    if (normalizedEmail.length === 0) {
      user.set("email", undefined);
    } else {
      user.email = normalizedEmail;
    }
  }

  await user.save();

  const { password_hash: _, ...userData } = user.toObject();
  return userData;
};

// Update currently logged-in user profile
export const updateMyProfile = async (
  user_id: string,
  shop_id: string,
  input: { name?: string; phone?: string; email?: string }
) => {
  return updateWorker(user_id, shop_id, input);
};

// Deactivate / reactivate a worker 
export const setWorkerActiveStatus = async (
  user_id: string,
  shop_id: string,
  is_active: boolean
) => {
  if (!Types.ObjectId.isValid(user_id)) {
    throw new HttpError(400, "Invalid user ID.");
  }

  const user = await User.findOne({
    _id: new Types.ObjectId(user_id),
    shop_id: new Types.ObjectId(shop_id),
  });

  if (!user) {
    throw new HttpError(404, "User not found.");
  }

  if (user.role === "owner") {
    throw new HttpError(403, "Cannot deactivate the shop owner.");
  }

  user.is_active = is_active;
  await user.save();

  return { _id: user._id, name: user.name, is_active: user.is_active };
};