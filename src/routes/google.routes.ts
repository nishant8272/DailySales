import { Router } from "express";
import { googleCallbackController } from "../controllers/google.controller";

const router = Router();

// GET /api/auth/google/callback
router.get("/callback", googleCallbackController);

export default router;


