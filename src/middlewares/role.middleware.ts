import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { HttpError } from "../utils/http-error";

// Only allow owners to access the route
export const ownerOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new HttpError(401, "Not authenticated."));
  }

  if (req.user.role !== "owner") {
    return next(
      new HttpError(403, "Access denied. Only shop owners can perform this action.")
    );
  }

  next();
};

// Allow both owner and worker
export const workerOrOwner = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new HttpError(401, "Not authenticated."));
  }

  if (!["owner", "worker"].includes(req.user.role)) {
    return next(new HttpError(403, "Access denied."));
  }

  next();
};