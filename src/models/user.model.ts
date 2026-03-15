import { Document, Schema, Types, model } from "mongoose";

export type UserRole = "owner" | "worker";
export type AuthProvider = "password" | "google";

export interface IUser extends Document {
  shop_id: Types.ObjectId;
  name: string;
  email?: string;
  google_id?: string;
  phone: string;
  role: UserRole;
  auth_provider: AuthProvider;
  password_hash?: string;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

const userSchema = new Schema<IUser>(
  {
    shop_id: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    google_id: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: ["owner", "worker"], required: true },
    auth_provider: {
      type: String,
      enum: ["password", "google"],
      default: "password",
      required: true,
    },
    password_hash: {
      type: String,
      select: false,
      required: function requiredPassword(this: IUser): boolean {
        return this.auth_provider === "password";
      },
    },
    is_active: { type: Boolean, default: true },
    last_login: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  }
);

userSchema.index({ shop_id: 1, phone: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ google_id: 1 }, { unique: true, sparse: true });

export const User = model<IUser>("User", userSchema);
