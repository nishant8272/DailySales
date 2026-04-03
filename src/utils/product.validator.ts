import { HttpError } from "../utils/http-error";

// Called inside createProduct controller 

export const validateCreateProduct = (body: {
  name?: unknown;
  category?: unknown;
  unit?: unknown;
  current_sell_price?: unknown;
  current_buy_price?: unknown;
  current_stock?: unknown;
  low_stock_threshold?: unknown;
}): void => {
  const {
    name,
    category,
    unit,
    current_sell_price,
    current_buy_price,
    current_stock,
    low_stock_threshold,
  } = body;

  const errors: string[] = [];

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push("Product name is required.");
  }

  if (!category || typeof category !== "string" || category.trim().length === 0) {
    errors.push("Category is required.");
  }

  const validUnits = ["piece", "packet", "kg", "litre"];
  if (!unit || !validUnits.includes(unit as string)) {
    errors.push(`Unit must be one of: ${validUnits.join(", ")}.`);
  }

  if (current_sell_price === undefined || current_sell_price === null) {
    errors.push("Sell price is required.");
  } else if (typeof current_sell_price !== "number" || current_sell_price < 0) {
    errors.push("Sell price must be a positive number.");
  }

  if (current_buy_price === undefined || current_buy_price === null) {
    errors.push("Buy price is required.");
  } else if (typeof current_buy_price !== "number" || current_buy_price < 0) {
    errors.push("Buy price must be a positive number.");
  }

  if (
    current_stock !== undefined &&
    (typeof current_stock !== "number" || current_stock < 0)
  ) {
    errors.push("Opening stock must be a positive number.");
  }

  if (
    low_stock_threshold !== undefined &&
    (typeof low_stock_threshold !== "number" || low_stock_threshold < 0)
  ) {
    errors.push("Low stock threshold must be a positive number.");
  }

  if (
    typeof current_buy_price === "number" &&
    typeof current_sell_price === "number" &&
    current_buy_price >= current_sell_price
  ) {
    errors.push("Buy price must be less than sell price. You will sell at a loss.");
  }

  if (errors.length > 0) {
    throw new HttpError( 400, errors.join(" "));
  }
};

// Called inside updateProduct controller 

export const validateUpdateProduct = (body: {
  name?: unknown;
  category?: unknown;
  unit?: unknown;
  current_sell_price?: unknown;
  current_buy_price?: unknown;
  low_stock_threshold?: unknown;
  current_stock?: unknown;
}): void => {
  const {
    name,
    category,
    unit,
    current_sell_price,
    current_buy_price,
    low_stock_threshold,
    current_stock,
  } = body;

  const errors: string[] = [];

  if (
    name !== undefined &&
    (typeof name !== "string" || name.trim().length === 0)
  ) {
    errors.push("Product name must be a non-empty string.");
  }

  if (
    category !== undefined &&
    (typeof category !== "string" || category.trim().length === 0)
  ) {
    errors.push("Category must be a non-empty string.");
  }

  const validUnits = ["piece", "packet", "kg", "litre"];
  if (unit !== undefined && !validUnits.includes(unit as string)) {
    errors.push(`Unit must be one of: ${validUnits.join(", ")}.`);
  }

  if (
    current_sell_price !== undefined &&
    (typeof current_sell_price !== "number" || current_sell_price < 0)
  ) {
    errors.push("Sell price must be a positive number.");
  }

  if (
    current_buy_price !== undefined &&
    (typeof current_buy_price !== "number" || current_buy_price < 0)
  ) {
    errors.push("Buy price must be a positive number.");
  }

  if (
    low_stock_threshold !== undefined &&
    (typeof low_stock_threshold !== "number" || low_stock_threshold < 0)
  ) {
    errors.push("Low stock threshold must be a positive number.");
  }

  if (
    current_stock !== undefined &&
    (typeof current_stock !== "number" || current_stock < 0)
  ) {
    errors.push("Current stock must be a positive number.");
  }

  if (errors.length > 0) {
    throw new HttpError( 400, errors.join(" "));
  }
};