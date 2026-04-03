import { Types } from "mongoose";
import { Product } from "../models";
import { HttpError } from "../utils/http-error";
import { IProduct } from "../models/product.model";

interface CreateProductInput {
  shop_id: string;
  name: string;
  category: string;
  unit: "piece" | "packet" | "kg" | "litre";
  current_sell_price: number;
  current_buy_price: number;
  current_stock?: number;
  low_stock_threshold?: number;
}

interface UpdateProductInput {
  name?: string;
  category?: string;
  unit?: "piece" | "packet" | "kg" | "litre";
  current_sell_price?: number;
  current_buy_price?: number;
  low_stock_threshold?: number;
  current_stock?: number;
}

// Create a new product 
export const createProduct = async (
  input: CreateProductInput
): Promise<any> => {
  const {
    shop_id,
    name,
    category,
    unit,
    current_sell_price,
    current_buy_price,
    current_stock = 0,
    low_stock_threshold = 5,
  } = input;

  // Check duplicate product name in the same shop
  const existing = await Product.findOne({
    shop_id: new Types.ObjectId(shop_id),
    name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    is_active: true,
  });

  if (existing) {
    throw new HttpError(
        409,
        `Product "${name}" already exists in your shop.`,
    );
  }

  const product = await Product.create({
    shop_id: new Types.ObjectId(shop_id),
    name: name.trim(),
    category: category.trim(),
    unit,
    current_sell_price,
    current_buy_price,
    current_stock,
    low_stock_threshold,
    is_active: true,
  });

  return product;
};

//  Get all active products for a shop 
export const getProductsByShop = async (
  shop_id: string,
  filters: {
    category?: string;
    low_stock_only?: boolean;
    search?: string;
  } = {}
): Promise<any  []> => {
  const query: Record<string, unknown> = {
    shop_id: new Types.ObjectId(shop_id)
  };

  if (filters.category) {
    query.category = { $regex: new RegExp(filters.category, "i") };
  }

  if (filters.low_stock_only) {
    // Products where current_stock < low_stock_threshold
    query.$expr = { $lt: ["$current_stock", "$low_stock_threshold"] };
  }

  if (filters.search) {
    query.name = { $regex: new RegExp(filters.search, "i") };
  }

  const products = await Product.find(query).sort({ name: 1 });

  return products;
};

// Get single product by ID 
export const getProductById = async (
  product_id: string,
  shop_id: string
): Promise<any> => {
  if (!Types.ObjectId.isValid(product_id)) {
    throw new HttpError( 400, "Invalid product ID.");
  }

  const product = await Product.findOne({
    _id: new Types.ObjectId(product_id),
    shop_id: new Types.ObjectId(shop_id),
    is_active: true,
  });

  if (!product) {
    throw new HttpError( 404, "Product not found.");
  }

  return product;
};

// Update product details
export const updateProduct = async (
  product_id: string,
  shop_id: string,
  input: UpdateProductInput
): Promise<IProduct> => {
  if (!Types.ObjectId.isValid(product_id)) {
    throw new HttpError( 400, "Invalid product ID.");
  }

  const product = await Product.findOne({
    _id: new Types.ObjectId(product_id),
    shop_id: new Types.ObjectId(shop_id),
    is_active: true,
  });

  if (!product) {
    throw new HttpError( 404, "Product not found.");
  }

  // If name is being changed, check for duplicates
  if (input.name && input.name.trim() !== product.name) {
    const duplicate = await Product.findOne({
      shop_id: new Types.ObjectId(shop_id),
      name: { $regex: new RegExp(`^${input.name.trim()}$`, "i") },
      is_active: true,
      _id: { $ne: new Types.ObjectId(product_id) },
    });

    if (duplicate) {
      throw new HttpError(
          409,
        `Another product named "${input.name}" already exists.`
      );
    }
  }

  // Apply only the fields that were sent
  if (input.name !== undefined) product.name = input.name.trim();
  if (input.category !== undefined) product.category = input.category.trim();
  if (input.unit !== undefined) product.unit = input.unit;

  const nextBuyPrice =
    input.current_buy_price !== undefined
      ? input.current_buy_price
      : product.current_buy_price;
  const nextSellPrice =
    input.current_sell_price !== undefined
      ? input.current_sell_price
      : product.current_sell_price;

  if (nextBuyPrice >= nextSellPrice) {
    throw new HttpError(
      400,
      "Buy price must be less than sell price. You will sell at a loss."
    );
  }

  if (input.current_sell_price !== undefined)
    product.current_sell_price = input.current_sell_price;
  if (input.current_buy_price !== undefined)
    product.current_buy_price = input.current_buy_price;
  if (input.low_stock_threshold !== undefined)
    product.low_stock_threshold = input.low_stock_threshold;
  if (input.current_stock !== undefined) product.current_stock = input.current_stock;

  await product.save();

  return product;
};

// Soft delete product 
export const deleteProduct = async (
  product_id: string,
  shop_id: string
): Promise<void> => {
  if (!Types.ObjectId.isValid(product_id)) {
    throw new HttpError( 400, "Invalid product ID.");
  }

  const product = await Product.findOne({
    _id: new Types.ObjectId(product_id),
    shop_id: new Types.ObjectId(shop_id),
  });

  if (!product) {
    throw new HttpError( 404, "Product not found.");
  }
 if (product.is_active) {
  product.is_active = false;
 }else{
  product.is_active = true;
 }
  await product.save();
};

// Get all product categories for a shop 
export const getCategoriesByShop = async (
  shop_id: string
): Promise<string[]> => {
  const categories = await Product.distinct("category", {
    shop_id: new Types.ObjectId(shop_id),
    is_active: true,
  });

  return categories.sort();
};