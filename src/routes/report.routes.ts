import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { protect } from "../middlewares/auth.middleware";
import { workerOrOwner } from "../middlewares/role.middleware";

const router = Router();

// All report routes require authentication
// Both owner and worker can view reports
router.use(protect, workerOrOwner);

// GET /api/reports/daily/:date              → full day breakdown (YYYY-MM-DD)
// GET /api/reports/weekly                   → last 7 days summary
// GET /api/reports/monthly?year=&month=     → full month with top products
// GET /api/reports/yearly?year=             → full year summary
// GET /api/reports/product/:id/price-history → buy/sell price change log
// GET /api/reports/product/:id/performance?from=&to= → product performance over range

router.get("/weekly", reportController.getWeeklyReport);
router.get("/monthly", reportController.getMonthlyReport);
router.get("/yearly", reportController.getYearlyReport);
router.get("/daily/:date", reportController.getDailyReport);
router.get("/product/:id/price-history", reportController.getProductPriceHistory);
router.get("/product/:id/performance", reportController.getProductPerformance);

export default router;