import { Types } from "mongoose";
import { ActivityLog } from "../models/activity-log.model";

export type LogActivityInput = {
  shop_id?: string | Types.ObjectId;
  user_id: string | Types.ObjectId;
  user_name: string;
  action: string;
  details: string;
  ip_address?: string;
};

export const logActivity = async (payload: LogActivityInput) => {
  try {
    await ActivityLog.create({
      shop_id: payload.shop_id ? new Types.ObjectId(payload.shop_id) : null,
      user_id: new Types.ObjectId(payload.user_id),
      user_name: payload.user_name.trim(),
      action: payload.action.trim(),
      details: payload.details.trim(),
      ip_address: payload.ip_address,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
