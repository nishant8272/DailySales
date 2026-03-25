import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as alertService from "../services/alert.service";

// GET /api/alerts
// Returns all unread alerts + total unread count
export const getUnreadAlerts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const alerts = await alertService.getUnreadAlerts(req.user!.shop_id);
    const count = alerts.length;

    res.status(200).json({ success: true, unread_count: count, data: alerts });
  } catch (error) {
    next(error);
  }
};

// GET /api/alerts/all?type=low_stock&limit=20
// Returns all alerts (read + unread) with optional filters
export const getAllAlerts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, limit } = req.query;

    const validTypes = ["low_stock", "price_loss", "shift_not_closed"];
    if (type && !validTypes.includes(type as string)) {
      res.status(400).json({
        success: false,
        message: `type must be one of: ${validTypes.join(", ")}`,
      });
      return;
    }

    const alerts = await alertService.getAllAlerts(req.user!.shop_id, {
      ...(type && { type: type as "low_stock" | "price_loss" | "shift_not_closed" }),
      ...(limit && { limit: parseInt(limit as string) }),
    });

    res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/alerts/:id/read
// Mark a single alert as read
export const markAlertAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id:any = req.params.id;
    await alertService.markAlertAsRead(id , req.user!.shop_id);

    res.status(200).json({ success: true, message: "Alert marked as read." });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/alerts/read-all
// Mark all unread alerts as read
export const markAllAlertsAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const updatedCount = await alertService.markAllAlertsAsRead(
      req.user!.shop_id
    );

    res.status(200).json({
      success: true,
      message: `${updatedCount} alerts marked as read.`,
      updated_count: updatedCount,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/alerts/count
// Returns only the unread count — useful for notification badge in UI
export const getUnreadAlertCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const count = await alertService.getUnreadAlertCount(req.user!.shop_id);

    res.status(200).json({ success: true, unread_count: count });
  } catch (error) {
    next(error);
  }
};