import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Shop } from "../models/shop.model";
import { User, UserRole } from "../models/user.model";
import { HttpError } from "../utils/http-error";

type CreateUserInput = {
  shop_id: string;
  name: string;
  phone: string;
  role: UserRole;
  password: string;
};

type UpdateUserInput = Partial<{
  name: string;
  phone: string;
  role: UserRole;
  password: string;
  is_active: boolean;
}>;

export const createUser = async (payload: CreateUserInput) => {
  const shop = await Shop.findById(payload.shop_id);

  if (!shop || !shop.is_active) {
    throw new HttpError(404, "Active shop not found");
  }

  const password_hash = await bcrypt.hash(payload.password, 10);

  const user = await User.create({
    shop_id: payload.shop_id,
    name: payload.name,
    phone: payload.phone,
    role: payload.role,
    auth_provider: "password",
    password_hash,
  });

  return User.findById(user._id).select("-password_hash");
};

export const getUserById = async (id: string) => {
  const user = await User.findById(id).select("-password_hash");

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return user;
};

export const listUsersByShop = async (shopId: string) => {
  return User.find({
    shop_id: new mongoose.Types.ObjectId(shopId),
    is_active: true,
  })
    .select("-password_hash")
    .sort({ created_at: -1 });
};

export const updateUserById = async (id: string, payload: UpdateUserInput) => {
  const updatePayload: Record<string, unknown> = { ...payload };

  if (typeof updatePayload.password === "string" && updatePayload.password) {
    updatePayload.password_hash = await bcrypt.hash(updatePayload.password, 10);
  }

  delete updatePayload.password;

  const user = await User.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
    select: "-password_hash",
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return user;
};

export const deactivateUserById = async (id: string) => {
  const user = await User.findByIdAndUpdate(
    id,
    { is_active: false },
    { new: true, runValidators: true, select: "-password_hash" }
  );

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return user;
};
