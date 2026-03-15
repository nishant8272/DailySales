import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import {
  createUser,
  deactivateUserById,
  getUserById,
  listUsersByShop,
  updateUserById,
} from "../services/user.service";
import { HttpError } from "../utils/http-error";

export const createUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shop_id, name, phone, role, password } = req.body;

    if (!shop_id || !name || !phone || !role || !password) {
      throw new HttpError(
        400,
        "shop_id, name, phone, role and password are required"
      );
    }

    if (!mongoose.isValidObjectId(shop_id)) {
      throw new HttpError(400, "Invalid shop_id");
    }

    if (role !== "owner" && role !== "worker") {
      throw new HttpError(400, "role must be owner or worker");
    }

    const user = await createUser({ shop_id, name, phone, role, password });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const getUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.isValidObjectId(id)) {
      throw new HttpError(400, "Invalid user id");
    }

    const user = await getUserById(id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const listUsersByShopController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopId = String(req.params.shopId);

    if (!mongoose.isValidObjectId(shopId)) {
      throw new HttpError(400, "Invalid shop id");
    }

    const users = await listUsersByShop(shopId);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const updateUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.isValidObjectId(id)) {
      throw new HttpError(400, "Invalid user id");
    }

    const user = await updateUserById(id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const deactivateUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.isValidObjectId(id)) {
      throw new HttpError(400, "Invalid user id");
    }

    const user = await deactivateUserById(id);
    res.json({ message: "User deactivated", user });
  } catch (error) {
    next(error);
  }
};
