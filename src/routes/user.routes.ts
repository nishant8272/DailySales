import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { protect } from "../middlewares/auth.middleware";
import { ownerOnly, workerOrOwner } from "../middlewares/role.middleware";

const router = Router();

router.use(protect);

// GET  /api/users          → list all users in shop (both can view)
// GET  /api/users/:id      → get single user (both can view)
// POST /api/users          → create worker (owner only)
// PATCH /api/users/:id     → update worker details (owner only)
// PATCH /api/users/:id/status → activate/deactivate worker (owner only)
// PATCH /api/users/me      → update own profile

router.get("/", workerOrOwner, userController.getShopUsers);
router.patch("/me", workerOrOwner, userController.updateMyProfile);
router.get("/:id", workerOrOwner, userController.getUser);

router.post("/", ownerOnly, userController.createWorker);
router.patch("/:id/status", ownerOnly, userController.setWorkerStatus);
router.patch("/:id", ownerOnly, userController.updateWorker);

export default router;