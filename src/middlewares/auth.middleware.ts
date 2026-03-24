import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";
import { HttpError } from "../utils/http-error";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    shop_id: string;
    role: "owner" | "worker";
    name: string;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(401, "Access denied. No token provided.");
    }

    const token:any = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET as string;

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      shop_id: string;
      role: "owner" | "worker";
    };

    const user = await User.findById(decoded.userId).select(
      "_id shop_id role name is_active"
    );
    if (!user) {
      throw new HttpError(401, "User not found. Token invalid.");
    }
    if (!user.is_active) {
      throw new HttpError(403, "Account is deactivated. Contact shop owner.");
    }

    req.user = {
      _id: user._id.toString(),
      shop_id: user.shop_id.toString(),
      role: user.role,
      name: user.name,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new HttpError(401, "Invalid token."));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new HttpError(401, "Token expired. Please login again."));
    }
    next(error);
  }
};