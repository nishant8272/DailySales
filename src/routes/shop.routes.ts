import { Router } from "express";
import {
  createShopController,
  deactivateShopController,
  getShopController,
  listShopsController,
  updateShopController,
} from "../controllers/shop.controller";

const router = Router();

router.post("/", createShopController);
router.get("/", listShopsController);
router.get("/:id", getShopController);
router.patch("/:id", updateShopController);
router.delete("/:id", deactivateShopController);

export default router;
