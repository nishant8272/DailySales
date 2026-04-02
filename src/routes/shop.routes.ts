import { Router } from "express";
import {
  createShopController,
  deactivateShopController,
  getShopController,
  listShopsController,
  updateMyShopController,
  updateShopController,
} from "../controllers/shop.controller";
import { protect } from "../middlewares/auth.middleware";
import { ownerOnly } from "../middlewares/role.middleware";

const router = Router();

router.post("/", createShopController);
router.get("/", listShopsController);
router.patch("/me", protect, ownerOnly, updateMyShopController);
router.get("/:id", getShopController);
router.patch("/:id", updateShopController);
router.delete("/:id", deactivateShopController);

export default router;
