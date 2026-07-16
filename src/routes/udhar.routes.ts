import { Router } from "express";
import * as udharController from "../controllers/udhar.controller";
import { protect } from "../middlewares/auth.middleware";
import { workerOrOwner } from "../middlewares/role.middleware";

const router = Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(workerOrOwner);

// POST   /api/udhar              -> Create a credit or payment entry
// GET    /api/udhar/customers    -> List customers with net balance (role-restricted)
// GET    /api/udhar/transactions -> List all transactions or single customer history
// DELETE /api/udhar/:id          -> Delete a transaction (role-restricted)

router.post("/", udharController.createUdharEntry);
router.get("/customers", udharController.getUdharCustomers);
router.get("/transactions", udharController.getUdharTransactions);
router.delete("/:id", udharController.deleteUdharEntry);

export default router;
