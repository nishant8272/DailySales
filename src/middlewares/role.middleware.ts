import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { HttpError } from "../utils/http-error";

// Only allow owners or super admins to access the route
export const ownerOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new HttpError(401, "Not authenticated."));
  }

  if (req.user.role !== "owner" && req.user.role !== "super_admin") {
    return next(
      new HttpError(403, "Access denied. Only shop owners can perform this action.")
    );
  }

  next();
};

// Allow owner, worker, and super admin
export const workerOrOwner = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new HttpError(401, "Not authenticated."));
  }

  if (!["owner", "worker", "super_admin"].includes(req.user.role)) {
    return next(new HttpError(403, "Access denied."));
  }

  next();
};

// Only allow super admins
export const superAdminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new HttpError(401, "Not authenticated."));
  }

  if (req.user.role !== "super_admin") {
    return next(
      new HttpError(403, "Access denied. Only super admins can perform this action.")
    );
  }

  next();
};