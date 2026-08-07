import { Schema, model, Document, Types } from "mongoose";

export interface IActivityLog extends Document {
  shop_id?: Types.ObjectId;
  user_id: Types.ObjectId;
  user_name: string;
  action: string;
  details: string;
  ip_address?: string;
  created_at: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    shop_id: { type: Schema.Types.ObjectId, ref: "Shop", default: null },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    user_name: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    ip_address: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
  }
);

activityLogSchema.index({ shop_id: 1, created_at: -1 });
activityLogSchema.index({ created_at: -1 });

export const ActivityLog = model<IActivityLog>("ActivityLog", activityLogSchema);
