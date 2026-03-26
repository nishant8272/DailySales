import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import authService from "../services/auth.service";
import { HttpError } from "../utils/http-error";
import { AuthRequest } from "../middlewares/auth.middleware";
import { getMe } from "../services/auth.service";

// GET /api/auth/me
export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getMe(req.user!._id);
 
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
 
export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phone, password, shop_id } = req.body;

    if (!phone || !password) {
      throw new HttpError(400, "phone and password are required");
    }

    if (shop_id && !mongoose.isValidObjectId(shop_id)) {
      throw new HttpError(400, "Invalid shop_id");
    }

    const user = await authService.loginWithPassword({ phone, password, shop_id });

    res.json({
      message: "Login successful",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const continueWithGoogleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== "string") {
      throw new HttpError(400, "idToken is required");
    }

    const result = await authService.continueWithGoogle(idToken);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const onboardGoogleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      idToken,
      name,
      phone,
      role,
      shop_id,
      shop_name,
      shop_address,
      timezone,
    } = req.body;

    if (!idToken || typeof idToken !== "string") {
      throw new HttpError(400, "idToken is required");
    }

    if (!name || !phone || !role) {
      throw new HttpError(400, "name, phone and role are required");
    }

    if (role !== "owner" && role !== "worker") {
      throw new HttpError(400, "role must be owner or worker");
    }

    const result = await authService.onboardGoogleUser({
      idToken,
      name,
      phone,
      role,
      shop_id,
      shop_name,
      shop_address,
      timezone,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
