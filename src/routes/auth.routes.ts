import { Router } from "express";
import {
  continueWithGoogleController,
  loginController,
  onboardGoogleController,
} from "../controllers/auth.controller";

const router = Router();
router.post("/login", loginController);
router.post("/google/continue", continueWithGoogleController);
router.post("/google/onboard", onboardGoogleController);

export default router;
