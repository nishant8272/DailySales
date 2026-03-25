import { Types } from "mongoose";
import { Alert } from "../models";
import { HttpError } from "../utils/http-error";

// GET ALL UNREAD ALERTS for a shop
export const getUnreadAlerts = async (shop_id: string) => {
  const alerts = await Alert.find({
    shop_id: new Types.ObjectId(shop_id),
    is_read: false,
  })
    .sort({ created_at: -1 })
    .populate("product_id", "name");

  return alerts;
};

// GET ALL ALERTS (read + unread) with optional type filter
export const getAllAlerts = async (
  shop_id: string,
  filters: {
    type?: "low_stock" | "price_loss" | "shift_not_closed";
    limit?: number;
  } = {}
) => {
  const query: Record<string, unknown> = {
    shop_id: new Types.ObjectId(shop_id),
  };

  if (filters.type) {
    query.type = filters.type;
  }

  const alerts = await Alert.find(query)
    .sort({ created_at: -1 })
    .limit(filters.limit ?? 50)
    .populate("product_id", "name");

  return alerts;
};

// MARK A SINGLE ALERT AS READ
export const markAlertAsRead = async (
  alert_id: string,
  shop_id: string
): Promise<void> => {
  if (!Types.ObjectId.isValid(alert_id)) {
    throw new HttpError(400, "Invalid alert ID.");
  }

  const alert = await Alert.findOne({
    _id: new Types.ObjectId(alert_id),
    shop_id: new Types.ObjectId(shop_id),
  });

  if (!alert) {
    throw new HttpError(404, "Alert not found.");
  }

  if (alert.is_read) return; // already read, do nothing

  alert.is_read = true;
  alert.read_at = new Date();
  await alert.save();
};

// MARK ALL ALERTS AS READ
export const markAllAlertsAsRead = async (shop_id: string): Promise<number> => {
  const result = await Alert.updateMany(
    { shop_id: new Types.ObjectId(shop_id), is_read: false },
    { $set: { is_read: true, read_at: new Date() } }
  );

  return result.modifiedCount;
};

// GET UNREAD ALERT COUNT (for badge/notification dot in UI)
export const getUnreadAlertCount = async (shop_id: string): Promise<number> => {
  return Alert.countDocuments({
    shop_id: new Types.ObjectId(shop_id),
    is_read: false,
  });
};