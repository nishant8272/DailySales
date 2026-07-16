import { Schema, model, Document, Types } from "mongoose";

export interface IUdharEntry extends Document {
  shop_id: Types.ObjectId;
  recorded_by: Types.ObjectId;
  customer_name: string;
  customer_phone?: string;
  type: "credit" | "payment";
  amount: number;
  packets: number;
  description?: string;
  date: Date;
  created_at: Date;
  updated_at: Date;
}

const udharEntrySchema = new Schema<IUdharEntry>(
  {
    shop_id: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    recorded_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customer_name: { type: String, required: true, trim: true },
    customer_phone: { type: String, trim: true, default: null },
    type: {
      type: String,
      enum: ["credit", "payment"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    packets: { type: Number, default: 0, min: 0 },
    description: { type: String, trim: true, default: null },
    date: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

udharEntrySchema.index({ shop_id: 1, customer_name: 1 });
udharEntrySchema.index({ shop_id: 1, recorded_by: 1 });
udharEntrySchema.index({ shop_id: 1, date: -1 });

export const UdharEntry = model<IUdharEntry>("UdharEntry", udharEntrySchema);
