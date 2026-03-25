// calculation.service.ts
// Pure functions only — no database calls, no imports, just math.
// Feed it numbers → get results back.
// Easy to unit test in isolation.
export interface ProductCalculationInput {
  opening_stock: number;
  total_added: number;
  closing_stock: number;
  active_sell_price: number;
  active_buy_price: number;
}

export interface ProductCalculationResult {
  units_sold: number;
  revenue: number;
  profit: number;
}

export interface DayTotalsInput {
  products: ProductCalculationResult[];
}

export interface DayTotalsResult {
  day_total_revenue: number;
  day_total_profit: number;
}

// Calculate units sold, revenue, profit for ONE product 
export const calculateProductSales = (
  input: ProductCalculationInput
): ProductCalculationResult => {
  const { opening_stock, total_added, closing_stock, active_sell_price, active_buy_price } =
    input;

  // Core formula: Opening + Added - Closing = Sold
  const units_sold = Math.max(0, opening_stock + total_added - closing_stock);

  // Revenue = what customer paid
  const revenue = parseFloat((units_sold * active_sell_price).toFixed(2));

  // Profit = Revenue - Cost of goods sold
  const cost = parseFloat((units_sold * active_buy_price).toFixed(2));
  const profit = parseFloat((revenue - cost).toFixed(2));

  return { units_sold, revenue, profit };
};

// Calculate day totals across ALL products 
export const calculateDayTotals = (input: DayTotalsInput): DayTotalsResult => {
  const { products } = input;

  const day_total_revenue = parseFloat(
    products.reduce((sum, p) => sum + p.revenue, 0).toFixed(2)
  );
  const day_total_profit = parseFloat(
    products.reduce((sum, p) => sum + p.profit, 0).toFixed(2)
  );
  return { day_total_revenue, day_total_profit };
};

// Check if sell price will cause a loss
export const isPriceLoss = (
  buy_price: number,
  sell_price: number
): boolean => {
  return buy_price >= sell_price;
};

// Check if stock is below threshold
export const isLowStock = (
  current_stock: number,
  low_stock_threshold: number
): boolean => {
  return current_stock < low_stock_threshold;
};

// Calculate updated total_added after a new stock addition 
export const calculateNewTotalAdded = (
  existing_total_added: number,
  new_quantity: number
): number => {
  return existing_total_added + new_quantity;
};