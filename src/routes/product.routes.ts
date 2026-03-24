import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { protect } from "../middlewares/auth.middleware";
import { ownerOnly } from "../middlewares/role.middleware";

const router = Router();

// All product routes require authentication
router.use(protect);

// Routes accessible by both owner and worker 

// GET /api/products           → list all products (with optional filters)
// GET /api/products/categories → list all categories
// GET /api/products/:id        → get single product

router.get("/categories", productController.getCategories);
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProduct);

// Owner-only routes

// POST   /api/products      → add new product
// PUT  /api/products/:id  → update product
// DELETE /api/products/:id  → soft delete product

router.post("/", ownerOnly, productController.createProduct);
router.put("/:id", ownerOnly, productController.updateProduct);
router.delete("/:id", ownerOnly, productController.deleteProduct);

export default router;