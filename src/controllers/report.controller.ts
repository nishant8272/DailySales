import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as reportService from "../services/Report.service";
import {
  validateDateParam,
  validateYearMonth,
  validateDateRange,
} from "../utils/report.validator";

// GET /api/reports/daily/:date
export const getDailyReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const date:any = req.params.date;
    validateDateParam(date);

    const shop_id:any = req.user!.shop_id;
    const report = await reportService.getDailyReport(
      shop_id,
      date
    );

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/weekly
export const getWeeklyReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const shop_id:any = req.user!.shop_id;
    const report = await reportService.getWeeklyReport(shop_id);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/monthly?year=2026&month=3
export const getMonthlyReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { year, month } = validateYearMonth(req.query.year, req.query.month);

    const shop_id:any = req.user!.shop_id;
    const report = await reportService.getMonthlyReport(
      shop_id,
      year,
      month
    );

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/yearly?year=2026
export const getYearlyReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const year = Number(req.query.year);

    if (!year || Number.isNaN(year) || year < 2020 || year > 2100) {
      res.status(400).json({
        success: false,
        message: "year must be a valid number (e.g. 2026).",
      });
      return;
    }

    const shop_id: any = req.user!.shop_id;
    const report = await reportService.getYearlyReport(shop_id, year);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/product/:id/price-history
export const getProductPriceHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id:any = req.params.id;
    const shop_id:any = req.user!.shop_id;
    const logs = await reportService.getProductPriceHistory(
      shop_id,
      id
    );

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/product/:id/performance?from=2026-03-01&to=2026-03-25
export const getProductPerformance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { from, to } = validateDateRange(req.query.from, req.query.to);
    const id:any = req.params.id;

    const shop_id:any = req.user!.shop_id;
    const report = await reportService.getProductPerformance(
      shop_id,
      id,
      from,
      to
    );

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};