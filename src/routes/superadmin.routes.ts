import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { superAdminOnly } from "../middlewares/role.middleware";
import * as controller from "../controllers/superadmin.controller";

const router = Router();

// Apply global middlewares
router.use(protect);
router.use(superAdminOnly);

// Stats & Charts
router.get("/stats", controller.getStatsController);
router.get("/charts", controller.getChartsController);

// Shop Management
router.get("/shops", controller.listShopsController);
router.post("/shops", controller.createShopController);
router.patch("/shops/:id", controller.updateShopController);
router.post("/shops/:id/reset", controller.resetShopDataController);

// User Management
router.get("/users", controller.listUsersController);
router.patch("/users/:id", controller.updateUserController);
router.post("/users/:id/reset-password", controller.resetUserPasswordController);

// Logs & Alerts
router.get("/logs", controller.listLogsController);
router.get("/alerts", controller.listAlertsController);

export default router;
