import { Response, NextFunction } from "express";
import { Types } from "mongoose";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as shiftService from "../services/shift.service";
import {
  validateAddStock,
  validateCloseShift,
  validateDateParam,
} from "../utils/shift.validator";
import { getShiftHistory } from "../services/shift.service";

// POST /api/shifts/start
export const startShift = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestedWorkerId = req.body?.worker_id as string | undefined;
    const selectedWorkerId =
      req.user!.role === "owner" && requestedWorkerId
        ? requestedWorkerId
        : req.user!._id;

    if (!Types.ObjectId.isValid(selectedWorkerId)) {
      res.status(400).json({ success: false, message: "Invalid worker_id." });
      return;
    }

    const { shift_log, daily_entry } = await shiftService.startShift(
      req.user!.shop_id,
      req.user!._id,
      selectedWorkerId
    );

    res.status(201).json({
      success: true,
      message: "Shift started successfully.",
      data: {
        shift_log_id: shift_log._id,
        date: daily_entry.date,
        total_products: daily_entry.products.length,
        daily_entry,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/shifts/add-stock
export const addStock = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { product_id, quantity_added, new_buy_price, new_sell_price, note } =
      req.body;

    validateAddStock({
      product_id,
      quantity_added,
      new_buy_price,
      new_sell_price,
      note,
    });

    const daily_entry = await shiftService.addStock(
      req.user!.shop_id,
      req.user!._id,
      {
        product_id,
        quantity_added,
        new_buy_price,
        new_sell_price,
        note,
      }
    );

    // Find the updated product to return in response
    const updatedProduct = daily_entry.products.find(
      (p) => p.product_id.toString() === product_id
    );

    res.status(200).json({
      success: true,
      message: "Stock added successfully.",
      data: {
        product: updatedProduct,
        daily_entry_id: daily_entry._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/shifts/close
export const closeShift = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { closing_stocks } = req.body;

    validateCloseShift({ closing_stocks });

    const daily_entry = await shiftService.closeShift(
      req.user!.shop_id,
      req.user!._id,
      closing_stocks
    );

    res.status(200).json({
      success: true,
      message: "Shift closed successfully.",
      data: {
        date: daily_entry.date,
        day_total_revenue: daily_entry.day_total_revenue,
        day_total_profit: daily_entry.day_total_profit,
        total_products: daily_entry.products.length,
        products: daily_entry.products,
      },
    });
  } catch (error) {
    // console.log("error", error)
    next(error);
  }
};

// GET /api/shifts/history?limit=10
export const getHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      res.status(400).json({ success: false, message: "limit must be between 1 and 100." });
      return;
    }

    const history = await getShiftHistory(req.user!.shop_id, limit);

    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};

// GET /api/shifts/today
export const getTodayShift = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const daily_entry = await shiftService.getTodayShift(req.user!.shop_id);

    if (!daily_entry) {
      res.status(200).json({
        success: true,
        message: "No shift started for today yet.",
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: daily_entry,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/shifts/:date
export const getShiftByDate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const date:any = req.params.date;

    validateDateParam(date);

    const daily_entry = await shiftService.getShiftByDate(
      req.user!.shop_id,
      date
    );

    res.status(200).json({
      success: true,
      data: daily_entry,
    });
  } catch (error) {
    next(error);
  }
};