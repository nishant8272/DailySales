import { Schema, model, Document, Types } from "mongoose";

export interface IDailyProduct {
  product_id: Types.ObjectId;
  product_name: string;
  opening_stock: number;
  closing_stock: number;
  total_added: number;
  units_sold: number;
  active_sell_price: number;
  active_buy_price: number;
  revenue: number;
  profit: number;
  is_closing_entered: boolean;
}

export interface IDailyEntry extends Document {
  shop_id: Types.ObjectId;
  date: string;
  shift_log_id: Types.ObjectId;
  opened_by: Types.ObjectId;
  closed_by?: Types.ObjectId;
  is_closed: boolean;
  closed_at?: Date;
  day_total_revenue: number;
  day_total_profit: number;
  products: IDailyProduct[];
  created_at: Date;
  updated_at: Date;
}

const dailyProductSchema = new Schema<IDailyProduct>(
  {
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    product_name: { type: String, required: true, trim: true },
    opening_stock: { type: Number, required: true, default: 0, min: 0 },
    closing_stock: { type: Number, default: 0, min: 0 },
    total_added: { type: Number, default: 0, min: 0 },
    units_sold: { type: Number, default: 0, min: 0 },
    active_sell_price: { type: Number, required: true, min: 0 },
    active_buy_price: { type: Number, required: true, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },
    profit: { type: Number, default: 0 },
    is_closing_entered: { type: Boolean, default: false },
  },
  { _id: false }
);

const dailyEntrySchema = new Schema<IDailyEntry>(
  {
    shop_id: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    shift_log_id: {
      type: Schema.Types.ObjectId,
      ref: "ShiftLog",
      required: true,
    },
    opened_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    closed_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    is_closed: { type: Boolean, default: false },
    closed_at: { type: Date, default: null },
    day_total_revenue: { type: Number, default: 0, min: 0 },
    day_total_profit: { type: Number, default: 0 },
    products: { type: [dailyProductSchema], default: [] },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

dailyEntrySchema.index({ shop_id: 1, date: 1 }, { unique: true });
dailyEntrySchema.index({ shop_id: 1, is_closed: 1 });

export const DailyEntry = model<IDailyEntry>("DailyEntry", dailyEntrySchema);