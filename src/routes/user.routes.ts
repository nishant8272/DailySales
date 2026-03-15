import { Router } from "express";
import {
  createUserController,
  deactivateUserController,
  getUserController,
  listUsersByShopController,
  updateUserController,
} from "../controllers/user.controller";

const router = Router();

router.post("/", createUserController);
router.get("/shop/:shopId", listUsersByShopController);
router.get("/:id", getUserController);
router.patch("/:id", updateUserController);
router.delete("/:id", deactivateUserController);

export default router;
