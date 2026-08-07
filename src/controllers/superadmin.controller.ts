import { Request, Response, NextFunction } from "express";
import * as superAdminService from "../services/superadmin.service";
import { AuthRequest } from "../middlewares/auth.middleware";
import { logActivity } from "../services/activity-log.service";

export const getStatsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await superAdminService.getGlobalStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getChartsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const charts = await superAdminService.getGlobalCharts();
    res.json({ success: true, data: charts });
  } catch (error) {
    next(error);
  }
};

export const listShopsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const search = req.query.search ? String(req.query.search) : undefined;
    const is_active = req.query.is_active !== undefined ? req.query.is_active === "true" : undefined;
    const sortBy = req.query.sortBy ? String(req.query.sortBy) : undefined;
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const result = await superAdminService.getShopsDirectory({
      search,
      is_active,
      sortBy,
      sortOrder,
      page,
      limit
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const createShopController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, owner_name, phone, address, email, password } = req.body;

    const result = await superAdminService.createShopWithOwner({
      name,
      owner_name,
      phone,
      address,
      email,
      password
    });

    await logActivity({
      user_id: req.user!._id,
      user_name: req.user!.name,
      action: "SHOP_CREATE",
      details: `Created shop "${name}" with owner "${owner_name}"`
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateShopController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const shop = await superAdminService.updateShop(id, req.body);

    await logActivity({
      user_id: req.user!._id,
      user_name: req.user!.name,
      action: "SHOP_UPDATE",
      details: `Updated shop "${shop.name}" details/status.`
    });

    res.json({ success: true, data: shop });
  } catch (error) {
    next(error);
  }
};

export const resetShopDataController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const result = await superAdminService.resetShopData(id);

    await logActivity({
      user_id: req.user!._id,
      user_name: req.user!.name,
      action: "SHOP_RESET",
      details: `Reset all transaction and user data for shop ID ${id}`
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const listUsersController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const search = req.query.search ? String(req.query.search) : undefined;
    const role = req.query.role ? String(req.query.role) : undefined;
    const is_active = req.query.is_active !== undefined ? req.query.is_active === "true" : undefined;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const result = await superAdminService.listAllUsers({
      search,
      role,
      is_active,
      page,
      limit
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const updateUserController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const user = await superAdminService.updateUser(id, req.body);

    await logActivity({
      user_id: req.user!._id,
      user_name: req.user!.name,
      action: "USER_UPDATE",
      details: `Updated details or role of user "${user.name}"`
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const resetUserPasswordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);
    const { password } = req.body;
    const result = await superAdminService.resetUserPassword(id, password);

    await logActivity({
      user_id: req.user!._id,
      user_name: req.user!.name,
      action: "USER_PASSWORD_RESET",
      details: `Reset password for user ID ${id}`
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const listLogsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const search = req.query.search ? String(req.query.search) : undefined;
    const action = req.query.action ? String(req.query.action) : undefined;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const result = await superAdminService.listLogs({
      search,
      action,
      page,
      limit
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const listAlertsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const is_read = req.query.is_read !== undefined ? req.query.is_read === "true" : undefined;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const result = await superAdminService.listGlobalAlerts({
      is_read,
      page,
      limit
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
