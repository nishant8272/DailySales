import { Document, Schema, model } from "mongoose";

export interface IShop extends Document {
  name: string;
  owner_name: string;
  phone: string;
  address?: string;
  timezone: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const shopSchema = new Schema<IShop>(
  {
    name: { type: String, required: true, trim: true },
    owner_name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    timezone: { type: String, default: "Asia/Kolkata" },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

shopSchema.index({ phone: 1 }, { unique: true });

export const Shop = model<IShop>("Shop", shopSchema);
