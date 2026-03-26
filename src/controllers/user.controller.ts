import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as userService from "../services/user.service";

// POST /api/users  → owner creates a worker
export const createWorker = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, password, email } = req.body;

    const errors: string[] = [];
    if (!name || name.trim().length === 0) errors.push("name is required.");
    if (!phone || phone.trim().length === 0) errors.push("phone is required.");
    if (!password || password.length < 6)
      errors.push("password must be at least 6 characters.");
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: errors.join(" ") });
      return;
    }

    const worker = await userService.createWorker(req.user!.shop_id, {
      name,
      phone,
      password,
      email,
    });

    res.status(201).json({
      success: true,
      message: "Worker account created successfully.",
      data: worker,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users  → list all users in the shop
export const getShopUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await userService.getShopUsers(req.user!.shop_id);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id  → get single user
export const getUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user_id:any = req.params.id;
    const user = await userService.getUserById(
      user_id,
      req.user!.shop_id
    );

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id  → update worker name/phone/email
export const updateWorker = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, email } = req.body;
    const user_id:any = req.params.id;

    const user = await userService.updateWorker(
      user_id,
      req.user!.shop_id,
      { name, phone, email }
    );

    res.status(200).json({
      success: true,
      message: "Worker updated successfully.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/status  → activate or deactivate worker
export const setWorkerStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { is_active } = req.body;
    const user_id:any = req.params.id;
    if (typeof is_active !== "boolean") {
      res.status(400).json({
        success: false,
        message: "is_active must be true or false.",
      });
      return;
    }

    const user = await userService.setWorkerActiveStatus(
      user_id,
      req.user!.shop_id,
      is_active
    );

    res.status(200).json({
      success: true,
      message: `Worker ${is_active ? "activated" : "deactivated"} successfully.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};