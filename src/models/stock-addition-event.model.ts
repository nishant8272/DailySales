import { Schema, model, Document, Types } from "mongoose";

export interface IStockAdditionEvent extends Document {
  shop_id: Types.ObjectId;
  product_id: Types.ObjectId;
  daily_entry_id: Types.ObjectId;
  date: string;
  quantity_added: number;
  new_buy_price: number;
  new_sell_price?: number;
  price_changed: boolean;
  added_by: Types.ObjectId;
  added_at: Date;
  note?: string;
}

const stockAdditionEventSchema = new Schema<IStockAdditionEvent>(
  {
    shop_id: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    daily_entry_id: {
      type: Schema.Types.ObjectId,
      ref: "DailyEntry",
      required: true,
    },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    quantity_added: { type: Number, required: true, min: 1 },
    new_buy_price: { type: Number, required: true, min: 0 },
    new_sell_price: { type: Number, default: null, min: 0 },
    price_changed: { type: Boolean, required: true, default: false },
    added_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    added_at: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true, default: null },
  },
  {
    versionKey: false,
  }
);

stockAdditionEventSchema.index({ daily_entry_id: 1 });
stockAdditionEventSchema.index({ product_id: 1, date: 1 });
stockAdditionEventSchema.index({ shop_id: 1, date: 1 });

export const StockAdditionEvent = model<IStockAdditionEvent>(
  "StockAdditionEvent",
  stockAdditionEventSchema
);