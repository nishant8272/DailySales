import { Schema, model, Document, Types } from "mongoose";

export interface IShiftLog extends Document {
  shop_id: Types.ObjectId;
  daily_entry_id: Types.ObjectId;
  worker_id: Types.ObjectId;
  date: string;
  shift_start: Date;
  shift_end?: Date;
  status: "open" | "closed";
  handover_note?: string;
  total_revenue: number;
  total_profit: number;
  created_at: Date;
}

const shiftLogSchema = new Schema<IShiftLog>(
  {
    shop_id: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    daily_entry_id: {
      type: Schema.Types.ObjectId,
      ref: "DailyEntry",
      required: true,
    },
    worker_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    shift_start: { type: Date, required: true, default: Date.now },
    shift_end: { type: Date, default: null },
    status: {
      type: String,
      enum: ["open", "closed"],
      required: true,
      default: "open",
    },
    handover_note: { type: String, trim: true, default: null },
    total_revenue: { type: Number, default: 0, min: 0 },
    total_profit: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
  }
);

shiftLogSchema.index({ shop_id: 1, date: 1 });
shiftLogSchema.index({ shop_id: 1, status: 1 });
shiftLogSchema.index({ worker_id: 1, date: 1 });

export const ShiftLog = model<IShiftLog>("ShiftLog", shiftLogSchema);