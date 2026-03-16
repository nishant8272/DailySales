import { Schema, model, Document, Types } from "mongoose";

export interface IPriceHistoryLog extends Document {
  shop_id: Types.ObjectId;
  product_id: Types.ObjectId;
  price_type: "buy" | "sell";
  old_price: number;
  new_price: number;
  changed_by: Types.ObjectId;
  changed_at: Date;
  reason?: string;
}

const priceHistoryLogSchema = new Schema<IPriceHistoryLog>(
  {
    shop_id: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    price_type: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },
    old_price: { type: Number, required: true, min: 0 },
    new_price: { type: Number, required: true, min: 0 },
    changed_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    changed_at: { type: Date, required: true, default: Date.now },
    reason: { type: String, trim: true, default: null },
  },
  {
    versionKey: false,
  }
);

// append-only — no update indexes needed, only reads
priceHistoryLogSchema.index({ product_id: 1, changed_at: -1 });
priceHistoryLogSchema.index({ shop_id: 1, changed_at: -1 });

export const PriceHistoryLog = model<IPriceHistoryLog>(
  "PriceHistoryLog",
  priceHistoryLogSchema
);