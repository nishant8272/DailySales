import { Types } from "mongoose";
import { DailyEntry, ShiftLog, Product, StockAdditionEvent, PriceHistoryLog, Alert, User } from "../models";
import { HttpError } from "../utils/http-error";
import {
    calculateProductSales,
    calculateDayTotals,
    isPriceLoss,
    isLowStock,
    calculateNewTotalAdded,
} from "./calculation.service";

// START SHIFT
// Creates a shift_log + daily_entry with all active products pre-filled.
// Opening stock = yesterday's closing stock (or current_stock if first time).
export const startShift = async (
    shop_id: string,
    started_by_id: string,
    worker_id?: string
): Promise<{ shift_log: InstanceType<typeof ShiftLog>; daily_entry: InstanceType<typeof DailyEntry> }> => {
    const shopObjectId = new Types.ObjectId(shop_id);
    const startedByObjectId = new Types.ObjectId(started_by_id);
    const workerObjectId = new Types.ObjectId(worker_id ?? started_by_id);

    // Get today's date in YYYY-MM-DD
    const today = getTodayDate();

    // Check if a shift already exists for today
    const existingEntry = await DailyEntry.findOne({ shop_id: shopObjectId, date: today });
    if (existingEntry) {
        throw new HttpError(409,"A shift has already been started for today.");
    }

    // Check if there's already an open shift (from previous day not closed)
    const openShift = await ShiftLog.findOne({ shop_id: shopObjectId, status: "open" });
    if (openShift) {
        throw new HttpError(
            409,
            "Previous shift is still open. Please close it before starting a new one."
        );
    }

    // Get all active products for this shop
    const products = await Product.find({ shop_id: shopObjectId, is_active: true });
    if (products.length === 0) {
        throw new HttpError(
            400,
            "No products found. Please add products before starting a shift."
        );
    }

    // Get yesterday's daily entry to carry over closing stock
    const yesterday = getYesterdayDate();
    const yesterdayEntry = await DailyEntry.findOne({
        shop_id: shopObjectId,
        date: yesterday,
        is_closed: true,
    });

    // Build products array for today's entry
    // Opening stock = yesterday's closing stock if available, else product's current_stock
    const productsArray = products.map((product) => {
        let opening_stock = product.current_stock;

        if (yesterdayEntry) {
            const yesterdayProduct = yesterdayEntry.products.find(
                (p) => p.product_id.toString() === product._id.toString()
            );
            if (yesterdayProduct) {
                opening_stock = yesterdayProduct.closing_stock;
            }
        }

        return {
            product_id: product._id,
            product_name: product.name,
            opening_stock,
            closing_stock: 0,
            total_added: 0,
            units_sold: 0,
            active_sell_price: product.current_sell_price,
            active_buy_price: product.current_buy_price,
            revenue: 0,
            profit: 0,
            is_closing_entered: false,
        };
    });

    // Create shift_log first (we need its _id for daily_entry)
    const shift_log = await ShiftLog.create({
        shop_id: shopObjectId,
        worker_id: workerObjectId,
        date: today,
        shift_start: new Date(),
        status: "open",
        total_revenue: 0,
        total_profit: 0,
        // daily_entry_id will be updated after daily_entry is created
        daily_entry_id: new Types.ObjectId(), // temp placeholder
    });

    // Create daily_entry
    const daily_entry = await DailyEntry.create({
        shop_id: shopObjectId,
        date: today,
        shift_log_id: shift_log._id,
        opened_by: startedByObjectId,
        is_closed: false,
        day_total_revenue: 0,
        day_total_profit: 0,
        products: productsArray,
    });

    // Update shift_log with the real daily_entry_id
    shift_log.daily_entry_id = daily_entry._id as Types.ObjectId;
    await shift_log.save();

    return { shift_log, daily_entry };
};

// ADD STOCK DURING SHIFT
// Adds stock to a product mid-shift.
// If new buy price is different → override active price + log price change.
export const addStock = async (
    shop_id: string,
    user_id: string,
    input: {
        product_id: string;
        quantity_added: number;
        new_buy_price: number;
        new_sell_price?: number;
        note?: string;
    }
): Promise<InstanceType<typeof DailyEntry>> => {
    const shopObjectId = new Types.ObjectId(shop_id);
    const userObjectId = new Types.ObjectId(user_id);
    const productObjectId = new Types.ObjectId(input.product_id);

    const today = getTodayDate();
    // Get today's open daily entry
    const daily_entry:any = await DailyEntry.findOne({
        shop_id: shopObjectId,
        date: today,
        is_closed: false,
    });
    if (!daily_entry) {
        throw new HttpError(
            404,
            "No open shift found for today. Please start a shift first."
        );
    }

    // Find the product inside daily entry's products array
    const productIndex = daily_entry.products.findIndex(
        (p:any) => p.product_id.toString() === input.product_id
    );

    if (productIndex === -1) {
        throw new HttpError(404, "Product not found in today's entry.");
    }

    const currentProduct:any = daily_entry.products[productIndex];
    const priceChanged = input.new_buy_price !== currentProduct.active_buy_price;

    // Update total_added using calculation service
    const new_total_added = calculateNewTotalAdded(
        currentProduct.total_added,
        input.quantity_added
    );

    // Update price if changed
    const new_sell_price = input.new_sell_price ?? currentProduct.active_sell_price;
    const new_buy_price = input.new_buy_price;

    // Check for price loss
    if (isPriceLoss(new_buy_price, new_sell_price)) {
        // Still allow it but create a price_loss alert
        await Alert.create({
            shop_id: shopObjectId,
            product_id: productObjectId,
            type: "price_loss",
            message: `"${currentProduct.product_name}" का खरीद भाव ₹${new_buy_price} है लेकिन बिक्री भाव ₹${new_sell_price} है — घाटा होगा!`,
            is_read: false,
        });
    }

    // Apply updates to product in array
    daily_entry.products[productIndex].total_added = new_total_added;
    daily_entry.products[productIndex].active_buy_price = new_buy_price;
    daily_entry.products[productIndex].active_sell_price = new_sell_price;

    // Mark array as modified so Mongoose saves nested changes
    daily_entry.markModified("products");
    await daily_entry.save();

    // Log the stock addition event
    await StockAdditionEvent.create({
        shop_id: shopObjectId,
        product_id: productObjectId,
        daily_entry_id: daily_entry._id,
        date: today,
        quantity_added: input.quantity_added,
        new_buy_price: input.new_buy_price,
        new_sell_price: input.new_sell_price ?? null,
        price_changed: priceChanged,
        added_by: userObjectId,
        added_at: new Date(),
        note: input.note ?? null,
    });

    // If price changed → log to price_history_log
    if (priceChanged) {
        await PriceHistoryLog.create({
            shop_id: shopObjectId,
            product_id: productObjectId,
            price_type: "buy",
            old_price: currentProduct.active_buy_price,
            new_price: input.new_buy_price,
            changed_by: userObjectId,
            changed_at: new Date(),
            reason: input.note ?? null,
        });
    }

    if (input.new_sell_price && input.new_sell_price !== currentProduct.active_sell_price) {
        await PriceHistoryLog.create({
            shop_id: shopObjectId,
            product_id: productObjectId,
            price_type: "sell",
            old_price: currentProduct.active_sell_price,
            new_price: input.new_sell_price,
            changed_by: userObjectId,
            changed_at: new Date(),
            reason: input.note ?? null,
        });
    }

    // Update product's current prices in products collection
    await Product.findByIdAndUpdate(productObjectId, {
        $inc: { current_stock: input.quantity_added },
        current_buy_price: new_buy_price,
        current_sell_price: new_sell_price,
    });

    return daily_entry;
};

// CLOSE SHIFT
// Owner enters closing stock for each product.
// Calculation engine runs → freezes the entry.
export const closeShift = async (
    shop_id: string,
    user_id: string,
    closing_stocks: { product_id: string; closing_stock: number }[]
): Promise<InstanceType<typeof DailyEntry>> => {
    const shopObjectId = new Types.ObjectId(shop_id);
    const userObjectId = new Types.ObjectId(user_id);

    const today = getTodayDate();

    // Get today's open daily entry
    const daily_entry:any = await DailyEntry.findOne({
        shop_id: shopObjectId,
        date: today,
        is_closed: false,
    });
    if (!daily_entry) {
        throw new HttpError(404, "No open shift found for today.");
    }

    // Validate all product_ids in closing_stocks exist in daily entry
    for (const item of closing_stocks) {
        const exists = daily_entry.products.find(
            (p:any) => p.product_id.toString() === item.product_id
        );
        if (!exists) {
            throw new HttpError(
                400,
                `Product ID ${item.product_id} not found in today's entry.`
            );
        }
        if (item.closing_stock < 0) {
            throw new HttpError(400, "Closing stock cannot be negative.");
        }
    }

    // Apply closing stocks and run calculation for each product
    const calculatedResults: { units_sold: number; revenue: number; profit: number }[] = [];
    for (let i = 0; i < daily_entry.products.length; i++) {
        const product:any = daily_entry.products[i];

        const closingEntry = closing_stocks.find(
            (c) => c.product_id === product.product_id.toString()
        );

        const closing_stock = closingEntry?.closing_stock ?? product.opening_stock;

        // Validate: closing stock can't exceed opening + added
        const max_possible = product.opening_stock + product.total_added;
        if (closing_stock > max_possible) {
            throw new HttpError(
                400,
                `Closing stock for "${product.product_name}" (${closing_stock}) cannot exceed opening + added stock (${max_possible}).`
            );
        }

        // Run calculation engine
        const result = calculateProductSales({
            opening_stock: product.opening_stock,
            total_added: product.total_added,
            closing_stock,
            active_sell_price: product.active_sell_price,
            active_buy_price: product.active_buy_price,
        });

        // Apply results to product
        daily_entry.products[i].closing_stock = closing_stock;
        daily_entry.products[i].units_sold = result.units_sold;
        daily_entry.products[i].revenue = result.revenue;
        daily_entry.products[i].profit = result.profit;
        daily_entry.products[i].is_closing_entered = true;

        calculatedResults.push(result);

        // Update product's live stock in products collection
        await Product.findByIdAndUpdate(product.product_id, {
            current_stock: closing_stock,
        });

        // Check low stock alert
        const productDoc = await Product.findById(product.product_id);
        if (productDoc && isLowStock(closing_stock, productDoc.low_stock_threshold)) {
            // Avoid duplicate alerts — check if unread alert already exists
            const existingAlert = await Alert.findOne({
                shop_id: shopObjectId,
                product_id: product.product_id,
                type: "low_stock",
                is_read: false,
            });

            if (!existingAlert) {
                await Alert.create({
                    shop_id: shopObjectId,
                    product_id: product.product_id,
                    type: "low_stock",
                    message: `"${product.product_name}" का स्टॉक कम है — सिर्फ ${closing_stock} बचे हैं। जल्दी मंगाओ!`,
                    is_read: false,
                });
            }
        }
    }

    // Calculate day totals using calculation service
    const { day_total_revenue, day_total_profit } = calculateDayTotals({
        products: calculatedResults,
    });

    // Freeze the daily entry
    daily_entry.is_closed = true;
    daily_entry.closed_by = userObjectId;
    daily_entry.closed_at = new Date();
    daily_entry.day_total_revenue = day_total_revenue;
    daily_entry.day_total_profit = day_total_profit;

    daily_entry.markModified("products");
    await daily_entry.save();

    // Close the shift log with totals
    await ShiftLog.findByIdAndUpdate(daily_entry.shift_log_id, {
        status: "closed",
        shift_end: new Date(),
        total_revenue: day_total_revenue,
        total_profit: day_total_profit,
    });

    return daily_entry;
};

// GET /api/shifts/history
// Returns last N closed shift entries — for the owner dashboard history table
export const getShiftHistory = async (
  shop_id: string,
  limit: number = 10
) => {
  const entries = await DailyEntry.find({
    shop_id: new Types.ObjectId(shop_id),
    is_closed: true,
  })
    .sort({ date: -1 })
    .limit(limit)
    .select(
      "date day_total_revenue day_total_profit opened_by closed_by closed_at products"
    )
    .populate("opened_by", "name role")
    .populate("closed_by", "name role");
 
  return entries.map((entry) => ({
    date: entry.date,
    day_total_revenue: entry.day_total_revenue,
    day_total_profit: entry.day_total_profit,
    opened_by: entry.opened_by,
    closed_by: entry.closed_by,
    closed_at: entry.closed_at,
    total_products: entry.products.length,
    total_units_sold: entry.products.reduce((sum, p) => sum + p.units_sold, 0),
  }));
};

// GET TODAY'S SHIFT STATUS
// Returns today's daily entry with full product details.
export const getTodayShift = async (
    shop_id: string
): Promise<InstanceType<typeof DailyEntry> | null> => {
    const today = getTodayDate();

    const daily_entry = await DailyEntry.findOne({
        shop_id: new Types.ObjectId(shop_id),
        date: today,
    }).populate("opened_by", "name role");

    return daily_entry;
};

// GET SHIFT BY DATE
export const getShiftByDate = async (
    shop_id: string,
    date: string
): Promise<InstanceType<typeof DailyEntry>> => {
    const daily_entry = await DailyEntry.findOne({
        shop_id: new Types.ObjectId(shop_id),
        date,
    });

    if (!daily_entry) {
        throw new HttpError(404, `No shift entry found for date: ${date}`);
    }

    return daily_entry;
};

// HELPERS
const getTodayDate = (): string => {
    // Always in IST
    return new Date()
        .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // returns YYYY-MM-DD
};

const getYesterdayDate = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};