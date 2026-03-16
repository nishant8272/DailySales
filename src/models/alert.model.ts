import { Schema, model, Document, Types } from "mongoose";

export interface IAlert extends Document {
  shop_id: Types.ObjectId;
  product_id?: Types.ObjectId;
  type: "low_stock" | "price_loss" | "shift_not_closed";
  message: string;
  is_read: boolean;
  created_at: Date;
  read_at?: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    shop_id: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    type: {
      type: String,
      enum: ["low_stock", "price_loss", "shift_not_closed"],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    is_read: { type: Boolean, default: false },
    read_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    versionKey: false,
  }
);

alertSchema.index({ shop_id: 1, is_read: 1 });
alertSchema.index({ shop_id: 1, created_at: -1 });

export const Alert = model<IAlert>("Alert", alertSchema);