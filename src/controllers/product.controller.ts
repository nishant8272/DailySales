import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as productService from "../services/product.service";
import { validateCreateProduct, validateUpdateProduct } from "../utils/product.validator";

// POST /api/products
export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      category,
      unit,
      current_sell_price,
      current_buy_price,
      current_stock,
      low_stock_threshold,
    } = req.body;

    // Validate — throws HttpError if invalid, caught by catch below
    validateCreateProduct({
      name,
      category,
      unit,
      current_sell_price,
      current_buy_price,
      current_stock,
      low_stock_threshold,
    });

    const product = await productService.createProduct({
      shop_id: req.user!.shop_id,
      name,
      category,
      unit,
      current_sell_price,
      current_buy_price,
      current_stock,
      low_stock_threshold,
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully.",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products
export const getAllProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, low_stock_only, search } = req.query;

    const products = await productService.getProductsByShop(
      req.user!.shop_id,
      {
        ...(category !== undefined ? { category: category as string } : {}),
        ...(low_stock_only !== undefined
          ? { low_stock_only: low_stock_only === "true" }
          : {}),
        ...(search !== undefined ? { search: search as string } : {}),
      }
    );

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
export const getProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid product id.",
      });
      return;
    }

    const product = await productService.getProductById(id, req.user!.shop_id);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/products/:id
export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      category,
      unit,
      current_sell_price,
      current_buy_price,
      low_stock_threshold,
      current_stock,
    } = req.body;

    // Validate — throws HttpError if invalid, caught by catch below
    validateUpdateProduct({
      name,
      category,
      unit,
      current_sell_price,
      current_buy_price,
      low_stock_threshold,
      current_stock,
    });

    const { id } = req.params;
    if (typeof id !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid product id.",
      });
      return;
    }

    const product = await productService.updateProduct(
      String(req.params.id),
      req.user!.shop_id,
      {
        name,
        category,
        unit,
        current_sell_price,
        current_buy_price,
        low_stock_threshold,
        current_stock,
      }
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const product_id = req.params.id;
    if (typeof product_id !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid product id.",
      });
      return;
    }
    
    await productService.deleteProduct(product_id, req.user!.shop_id);

    res.status(200).json({
      success: true,
      message: "Product removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/categories
export const getCategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await productService.getCategoriesByShop(
      req.user!.shop_id
    );

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};