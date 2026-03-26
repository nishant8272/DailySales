import { Router } from "express";
import {
  continueWithGoogleController,
  getMyProfile,
  loginController,
  onboardGoogleController,
} from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();
router.post("/login", loginController);
router.post("/google/continue", continueWithGoogleController);
router.post("/google/onboard", onboardGoogleController);
router.get("/me", protect, getMyProfile)

export default router;
