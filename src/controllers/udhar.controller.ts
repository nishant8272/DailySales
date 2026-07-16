import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as udharService from "../services/udhar.service";
import { HttpError } from "../utils/http-error";

// POST /api/udhar
export const createUdharEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { customer_name, customer_phone, type, amount, packets, description, date } = req.body;
    const shop_id = req.user!.shop_id;
    const recorded_by = req.user!._id;

    if (!customer_name) {
      throw new HttpError(400, "customer_name is required");
    }

    if (!type || !["credit", "payment"].includes(type)) {
      throw new HttpError(400, "type must be 'credit' or 'payment'");
    }

    if (amount === undefined || amount <= 0) {
      throw new HttpError(400, "amount must be greater than 0");
    }

    const data = await udharService.createUdharEntry({
      shop_id,
      recorded_by,
      customer_name,
      customer_phone,
      type,
      amount: Number(amount),
      packets: packets ? Number(packets) : 0,
      description,
      date,
    });

    res.status(201).json({
      success: true,
      message: "Udhar entry created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/udhar/customers
export const getUdharCustomers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const shopId = req.user!.shop_id;
    const userId = req.user!._id;
    const role = req.user!.role;
    const recordedBy = req.query.recorded_by as string | undefined;

    const data = await udharService.getUdharCustomers(shopId, userId, role, recordedBy);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/udhar/transactions
export const getUdharTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const shopId = req.user!.shop_id;
    const userId = req.user!._id;
    const role = req.user!.role;
    const customerName = req.query.customer_name as string | undefined;
    const recordedBy = req.query.recorded_by as string | undefined;

    const data = await udharService.getUdharTransactions(shopId, userId, role, customerName, recordedBy);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/udhar/:id
export const deleteUdharEntry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const entryId = req.params.id as string;
    const shopId = req.user!.shop_id;
    const userId = req.user!._id;
    const role = req.user!.role;

    const result = await udharService.deleteUdharEntry(entryId, shopId, userId, role);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
