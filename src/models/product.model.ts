import { Schema, model, Document, Types } from "mongoose";

export interface IProduct extends Document {
  shop_id: Types.ObjectId;
  name: string;
  category: string;
  unit: "piece" | "packet" | "kg" | "litre";
  current_sell_price: number;
  current_buy_price: number;
  current_stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const productSchema = new Schema<IProduct>(
  {
    shop_id: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    unit: {
      type: String,
      enum: ["piece", "packet", "kg", "litre"],
      required: true,
    },
    current_sell_price: { type: Number, required: true, min: 0 },
    current_buy_price: { type: Number, required: true, min: 0 },
    current_stock: { type: Number, required: true, default: 0, min: 0 },
    low_stock_threshold: { type: Number, default: 5, min: 0 },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

productSchema.index({ shop_id: 1, name: 1 }, { unique: true });
productSchema.index({ shop_id: 1, category: 1 });
productSchema.index({ shop_id: 1, is_active: 1 });

export const Product = model<IProduct>("Product", productSchema);