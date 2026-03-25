import { Router } from "express";
import * as alertController from "../controllers/alert.controller";
import { protect } from "../middlewares/auth.middleware";
import { ownerOnly, workerOrOwner } from "../middlewares/role.middleware";

const router = Router();

router.use(protect);

// GET  /api/alerts              → unread alerts only
// GET  /api/alerts/all          → all alerts with optional ?type= filter
// GET  /api/alerts/count        → just the unread badge count
// PATCH /api/alerts/read-all    → mark all as read (owner only)
// PATCH /api/alerts/:id/read    → mark one as read (owner only)

router.get("/count", workerOrOwner, alertController.getUnreadAlertCount);
router.get("/all", workerOrOwner, alertController.getAllAlerts);
router.get("/", workerOrOwner, alertController.getUnreadAlerts);

// read-all must come before /:id/read — otherwise Express matches "read-all" as an :id
router.patch("/read-all", ownerOnly, alertController.markAllAlertsAsRead);
router.patch("/:id/read", ownerOnly, alertController.markAlertAsRead);

export default router;