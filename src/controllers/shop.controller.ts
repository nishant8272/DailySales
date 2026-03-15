import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import {
  createShop,
  deactivateShopById,
  getShopById,
  listActiveShops,
  updateShopById,
} from "../services/shop.service";
import { HttpError } from "../utils/http-error";

export const createShopController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, owner_name, phone, address, timezone } = req.body;

    if (!name || !owner_name || !phone) {
      throw new HttpError(400, "name, owner_name and phone are required");
    }

    const shop = await createShop({ name, owner_name, phone, address, timezone });
    res.status(201).json(shop);
  } catch (error) {
    next(error);
  }
};

export const listShopsController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shops = await listActiveShops();
    res.json(shops);
  } catch (error) {
    next(error);
  }
};

export const getShopController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.isValidObjectId(id)) {
      throw new HttpError(400, "Invalid shop id");
    }

    const shop = await getShopById(id);
    res.json(shop);
  } catch (error) {
    next(error);
  }
};

export const updateShopController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.isValidObjectId(id)) {
      throw new HttpError(400, "Invalid shop id");
    }

    const shop = await updateShopById(id, req.body);
    res.json(shop);
  } catch (error) {
    next(error);
  }
};

export const deactivateShopController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.isValidObjectId(id)) {
      throw new HttpError(400, "Invalid shop id");
    }

    const shop = await deactivateShopById(id);
    res.json({ message: "Shop deactivated", shop });
  } catch (error) {
    next(error);
  }
};
