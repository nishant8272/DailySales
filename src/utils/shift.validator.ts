import { HttpError } from "./http-error";

// Validate add stock request
export const validateAddStock = (body: {
  product_id?: unknown;
  quantity_added?: unknown;
  new_buy_price?: unknown;
  new_sell_price?: unknown;
  note?: unknown;
}): void => {
  const { product_id, quantity_added, new_buy_price, new_sell_price, note } = body;

  const errors: string[] = [];

  if (!product_id || typeof product_id !== "string" || product_id.trim().length === 0) {
    errors.push("product_id is required.");
  }

  if (quantity_added === undefined || quantity_added === null) {
    errors.push("quantity_added is required.");
  } else if (typeof quantity_added !== "number" || quantity_added < 1) {
    errors.push("quantity_added must be a positive number (minimum 1).");
  }

  if (new_buy_price === undefined || new_buy_price === null) {
    errors.push("new_buy_price is required.");
  } else if (typeof new_buy_price !== "number" || new_buy_price < 0) {
    errors.push("new_buy_price must be a positive number.");
  }

  if (new_sell_price !== undefined && new_sell_price !== null) {
    if (typeof new_sell_price !== "number" || new_sell_price < 0) {
      errors.push("new_sell_price must be a positive number.");
    }
  }

  if (note !== undefined && note !== null && typeof note !== "string") {
    errors.push("note must be a string.");
  }

  if (errors.length > 0) {
    throw new HttpError( 400, errors.join(" "));
  }
};

// Validate close shift request
export const validateCloseShift = (body: {
  closing_stocks?: unknown;
}): void => {
  const { closing_stocks } = body;

  const errors: string[] = [];

  if (!closing_stocks) {
    errors.push("closing_stocks array is required.");
  } else if (!Array.isArray(closing_stocks)) {
    errors.push("closing_stocks must be an array.");
  } else if (closing_stocks.length === 0) {
    errors.push("closing_stocks cannot be empty.");
  } else {
    closing_stocks.forEach((item: unknown, index: number) => {
      if (typeof item !== "object" || item === null) {
        errors.push(`Item at index ${index} must be an object.`);
        return;
      }

      const entry = item as Record<string, unknown>;

      if (!entry.product_id || typeof entry.product_id !== "string") {
        errors.push(`Item at index ${index}: product_id is required.`);
      }

      if (entry.closing_stock === undefined || entry.closing_stock === null) {
        errors.push(`Item at index ${index}: closing_stock is required.`);
      } else if (
        typeof entry.closing_stock !== "number" ||
        entry.closing_stock < 0
      ) {
        errors.push(`Item at index ${index}: closing_stock must be 0 or a positive number.`);
      }
    });
  }

  if (errors.length > 0) {
    throw new HttpError( 400, errors.join(" "));
  }
};

// Validate date format (YYYY-MM-DD)
export const validateDateParam = (date: string): void => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new HttpError(400, "Date must be in YYYY-MM-DD format.");
  }
};