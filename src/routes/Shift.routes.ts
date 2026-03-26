import { Router } from "express";
import * as shiftController from "../controllers/shift.controller";
import { protect } from "../middlewares/auth.middleware";
import { ownerOnly, workerOrOwner } from "../middlewares/role.middleware";

const router = Router();

// All shift routes require authentication
router.use(protect);

// Both owner and worker 

// POST /api/shifts/start      → start today's shift (creates daily_entry)
// POST /api/shifts/add-stock  → add stock during shift
// GET  /api/shifts/today      → get today's shift status
// GET  /api/shifts/:date      → get shift by date (YYYY-MM-DD)

router.post("/start", workerOrOwner, shiftController.startShift);
router.post("/add-stock", workerOrOwner, shiftController.addStock);
router.get("/today", workerOrOwner, shiftController.getTodayShift);
router.get("/history", workerOrOwner, shiftController.getHistory);
router.get("/:date", workerOrOwner, shiftController.getShiftByDate);

// Owner only

// POST /api/shifts/close → enter closing stock + freeze entry (owner only)

router.post("/close", ownerOnly, shiftController.closeShift);

export default router;