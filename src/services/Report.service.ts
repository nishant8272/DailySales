import { Types } from "mongoose";
import { DailyEntry, StockAdditionEvent, PriceHistoryLog } from "../models";
import { HttpError } from "../utils/http-error";

// DAILY REPORT
// Returns a single day's full entry — all products, totals, per-product breakdown
export const getDailyReport = async (shop_id: string, date: string) => {
  const entry = await DailyEntry.findOne({
    shop_id: new Types.ObjectId(shop_id),
    date,
  });

  if (!entry) {
    throw new HttpError(404, `No entry found for date: ${date}`);
  }

  // Build per-product summary
  const products = entry.products.map((p) => ({
    product_id: p.product_id,
    product_name: p.product_name,
    opening_stock: p.opening_stock,
    total_added: p.total_added,
    closing_stock: p.closing_stock,
    units_sold: p.units_sold,
    active_sell_price: p.active_sell_price,
    active_buy_price: p.active_buy_price,
    revenue: p.revenue,
    profit: p.profit,
    is_closing_entered: p.is_closing_entered,
  }));

  return {
    date: entry.date,
    is_closed: entry.is_closed,
    closed_at: entry.closed_at,
    opened_by: entry.opened_by,
    closed_by: entry.closed_by,
    day_total_revenue: entry.day_total_revenue,
    day_total_profit: entry.day_total_profit,
    total_products: products.length,
    products,
  };
};

// WEEKLY REPORT
// Last 7 days — revenue + profit per day, best day, total for the week
export const getWeeklyReport = async (shop_id: string) => {
  const shopObjectId = new Types.ObjectId(shop_id);

  // Get last 7 days date strings in YYYY-MM-DD
  const dates = getLast7Days();

  const entries = await DailyEntry.find({
    shop_id: shopObjectId,
    date: { $in: dates },
    is_closed: true,
  }).sort({ date: 1 });

  // Build a day-by-day breakdown
  const dailyBreakdown = dates.map((date) => {
    const entry = entries.find((e) => e.date === date);

    if (!entry) {
      return {
        date,
        revenue: 0,
        profit: 0,
        units_sold: 0,
        has_data: false,
      };
    }

    const units_sold = entry.products.reduce((sum, p) => sum + p.units_sold, 0);

    return {
      date,
      revenue: entry.day_total_revenue,
      profit: entry.day_total_profit,
      units_sold,
      has_data: true,
    };
  });

  // Week totals
  const week_total_revenue = parseFloat(
    dailyBreakdown.reduce((sum, d) => sum + d.revenue, 0).toFixed(2)
  );
  const week_total_profit = parseFloat(
    dailyBreakdown.reduce((sum, d) => sum + d.profit, 0).toFixed(2)
  );
  const week_total_units = dailyBreakdown.reduce((sum, d) => sum + d.units_sold, 0);

  // Best day
  const best_day = dailyBreakdown.reduce(
    (best:any, d) => (d.revenue > best.revenue ? d : best),
    dailyBreakdown[0]
  );

  const productMap = new Map<
    string,
    { product_name: string; units_sold: number; revenue: number; profit: number }
  >();

  for (const entry of entries) {
    for (const product of entry.products) {
      const key = product.product_id.toString();
      const existing = productMap.get(key);

      if (existing) {
        existing.units_sold += product.units_sold;
        existing.revenue = parseFloat((existing.revenue + product.revenue).toFixed(2));
        existing.profit = parseFloat((existing.profit + product.profit).toFixed(2));
      } else {
        productMap.set(key, {
          product_name: product.product_name,
          units_sold: product.units_sold,
          revenue: product.revenue,
          profit: product.profit,
        });
      }
    }
  }

  const top_products = Array.from(productMap.entries())
    .map(([product_id, data]) => ({ product_id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    period: { from: dates[0], to: dates[dates.length - 1] },
    week_total_revenue,
    week_total_profit,
    week_total_units,
    best_day: best_day.has_data ? best_day : null,
    top_products,
    daily_breakdown: dailyBreakdown,
  };
};

// MONTHLY REPORT
// Current month — revenue + profit per day, top 5 products, monthly totals
export const getMonthlyReport = async (
  shop_id: string,
  year: number,
  month: number  // 1-12
) => {
  const shopObjectId = new Types.ObjectId(shop_id);

  // Build YYYY-MM prefix for querying
  const monthStr = month.toString().padStart(2, "0");
  const prefix = `${year}-${monthStr}`;

  const entries = await DailyEntry.find({
    shop_id: shopObjectId,
    date: { $regex: `^${prefix}` },
    is_closed: true,
  }).sort({ date: 1 });

  if (entries.length === 0) {
    return {
      period: { year, month },
      month_total_revenue: 0,
      month_total_profit: 0,
      month_total_units: 0,
      top_products: [],
      daily_breakdown: [],
    };
  }

  // Daily breakdown for the month
  const dailyBreakdown = entries.map((entry) => {
    const units_sold = entry.products.reduce((sum, p) => sum + p.units_sold, 0);
    return {
      date: entry.date,
      revenue: entry.day_total_revenue,
      profit: entry.day_total_profit,
      units_sold,
    };
  });

  // Month totals
  const month_total_revenue = parseFloat(
    entries.reduce((sum, e) => sum + e.day_total_revenue, 0).toFixed(2)
  );
  const month_total_profit = parseFloat(
    entries.reduce((sum, e) => sum + e.day_total_profit, 0).toFixed(2)
  );
  const month_total_units = dailyBreakdown.reduce((sum, d) => sum + d.units_sold, 0);

  // Top 5 products by revenue across all days this month
  const productMap = new Map<
    string,
    { product_name: string; units_sold: number; revenue: number; profit: number }
  >();

  for (const entry of entries) {
    for (const p of entry.products) {
      const key = p.product_id.toString();
      const existing = productMap.get(key);

      if (existing) {
        existing.units_sold += p.units_sold;
        existing.revenue = parseFloat((existing.revenue + p.revenue).toFixed(2));
        existing.profit = parseFloat((existing.profit + p.profit).toFixed(2));
      } else {
        productMap.set(key, {
          product_name: p.product_name,
          units_sold: p.units_sold,
          revenue: p.revenue,
          profit: p.profit,
        });
      }
    }
  }

  const top_products = Array.from(productMap.entries())
    .map(([product_id, data]) => ({ product_id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    period: { year, month },
    month_total_revenue,
    month_total_profit,
    month_total_units,
    top_products,
    daily_breakdown: dailyBreakdown,
  };
};

// YEARLY REPORT
// Full year — revenue + profit per month, top months, yearly totals
export const getYearlyReport = async (shop_id: string, year: number) => {
  const shopObjectId = new Types.ObjectId(shop_id);
  const yearPrefix = `${year}-`;

  const entries = await DailyEntry.find({
    shop_id: shopObjectId,
    date: { $regex: `^${yearPrefix}` },
    is_closed: true,
  }).sort({ date: 1 });

  const monthlyBreakdown = Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, "0");
    return {
      month: `${year}-${month}`,
      revenue: 0,
      profit: 0,
      units_sold: 0,
      has_data: false,
    };
  });

  for (const entry of entries) {
    const monthIndex = Number(entry.date.slice(5, 7)) - 1;
    const monthRow = monthlyBreakdown[monthIndex];

    if (!monthRow) {
      continue;
    }

    const unitsSold = entry.products.reduce((sum, product) => sum + product.units_sold, 0);

    monthRow.revenue = parseFloat((monthRow.revenue + entry.day_total_revenue).toFixed(2));
    monthRow.profit = parseFloat((monthRow.profit + entry.day_total_profit).toFixed(2));
    monthRow.units_sold += unitsSold;
    monthRow.has_data = true;
  }

  const yearly_total_revenue = parseFloat(
    monthlyBreakdown.reduce((sum, month) => sum + month.revenue, 0).toFixed(2)
  );
  const yearly_total_profit = parseFloat(
    monthlyBreakdown.reduce((sum, month) => sum + month.profit, 0).toFixed(2)
  );
  const yearly_total_units = monthlyBreakdown.reduce((sum, month) => sum + month.units_sold, 0);

  const best_month = monthlyBreakdown.reduce(
    (best, month) => (month.revenue > best.revenue ? month : best),
    monthlyBreakdown[0]!
  );

  const productMap = new Map<
    string,
    { product_name: string; units_sold: number; revenue: number; profit: number }
  >();

  for (const entry of entries) {
    for (const product of entry.products) {
      const key = product.product_id.toString();
      const existing = productMap.get(key);

      if (existing) {
        existing.units_sold += product.units_sold;
        existing.revenue = parseFloat((existing.revenue + product.revenue).toFixed(2));
        existing.profit = parseFloat((existing.profit + product.profit).toFixed(2));
      } else {
        productMap.set(key, {
          product_name: product.product_name,
          units_sold: product.units_sold,
          revenue: product.revenue,
          profit: product.profit,
        });
      }
    }
  }

  const top_products = Array.from(productMap.entries())
    .map(([product_id, data]) => ({ product_id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    period: { year },
    yearly_total_revenue,
    yearly_total_profit,
    yearly_total_units,
    best_month: best_month.has_data ? best_month : null,
    top_products,
    monthly_breakdown: monthlyBreakdown,
  };
};

// PRICE HISTORY — per product
// Full price change log for a product — both buy and sell price changes
export const getProductPriceHistory = async (
  shop_id: string,
  product_id: string
) => {
  if (!Types.ObjectId.isValid(product_id)) {
    throw new HttpError(400, "Invalid product ID.");
  }

  const logs = await PriceHistoryLog.find({
    shop_id: new Types.ObjectId(shop_id),
    product_id: new Types.ObjectId(product_id),
  })
    .sort({ changed_at: -1 })
    .populate("changed_by", "name role");

  return logs;
};

// PRODUCT PERFORMANCE — single product across date range
// How a specific product performed day by day
export const getProductPerformance = async (    
  shop_id: string,
  product_id: string,
  from: string,
  to: string
) => {
  if (!Types.ObjectId.isValid(product_id)) {
    throw new HttpError(400, "Invalid product ID.");
  }

  const entries = await DailyEntry.find({
    shop_id: new Types.ObjectId(shop_id),
    date: { $gte: from, $lte: to },
    is_closed: true,
  }).sort({ date: 1 });

  const performance = entries
    .map((entry) => {
      const product = entry.products.find(
        (p) => p.product_id.toString() === product_id
      );

      if (!product) return null;

      return {
        date: entry.date,
        opening_stock: product.opening_stock,
        total_added: product.total_added,
        closing_stock: product.closing_stock,
        units_sold: product.units_sold,
        active_sell_price: product.active_sell_price,
        active_buy_price: product.active_buy_price,
        revenue: product.revenue,
        profit: product.profit,
      };
    })
    .filter(Boolean);

  const total_units_sold = performance.reduce((sum, p) => sum + p!.units_sold, 0);
  const total_revenue = parseFloat(
    performance.reduce((sum, p) => sum + p!.revenue, 0).toFixed(2)
  );
  const total_profit = parseFloat(
    performance.reduce((sum, p) => sum + p!.profit, 0).toFixed(2)
  );

  return {
    product_id,
    period: { from, to },
    total_units_sold,
    total_revenue,
    total_profit,
    daily: performance,
  };
};

// HELPERS
const getLast7Days = (): string[] => {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
  }
  return dates;
};