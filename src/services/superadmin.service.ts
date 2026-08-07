import { Types } from "mongoose";
import { Shop, User, DailyEntry, Product, UdharEntry, ShiftLog, Alert, PriceHistoryLog, StockAdditionEvent, ActivityLog } from "../models";
import bcrypt from "bcrypt";
import { HttpError } from "../utils/http-error";

// 1. PLATFORM-WIDE STATS
export const getGlobalStats = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Shop stats
  const totalShops = await Shop.countDocuments();
  const activeShops = await Shop.countDocuments({ is_active: true });
  const inactiveShops = await Shop.countDocuments({ is_active: false });
  const newShops = await Shop.countDocuments({ created_at: { $gte: thirtyDaysAgo } });

  // User stats
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ is_active: true });
  const shopOwners = await User.countDocuments({ role: "owner" });
  const employees = await User.countDocuments({ role: "worker" });

  // Sales stats
  const salesAggregate = await DailyEntry.aggregate([
    { $match: { is_closed: true } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$day_total_revenue" },
        totalProfit: { $sum: "$day_total_profit" },
        totalEntries: { $sum: 1 },
        totalUnitsSold: { $sum: { $sum: "$products.units_sold" } }
      }
    }
  ]);
  const salesStats = salesAggregate[0] || { totalRevenue: 0, totalProfit: 0, totalEntries: 0, totalUnitsSold: 0 };
  const totalRevenue = salesStats.totalRevenue;
  const totalProfit = salesStats.totalProfit;
  const totalExpenses = parseFloat((totalRevenue - totalProfit).toFixed(2));
  const averageSaleValue = salesStats.totalEntries > 0 ? parseFloat((totalRevenue / salesStats.totalEntries).toFixed(2)) : 0;

  // Inventory stats
  const inventoryAggregate = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalValue: { $sum: { $multiply: ["$current_stock", "$current_buy_price"] } },
        lowStock: {
          $sum: {
            $cond: [{ $lt: ["$current_stock", "$low_stock_threshold"] }, 1, 0]
          }
        },
        outOfStock: {
          $sum: {
            $cond: [{ $eq: ["$current_stock", 0] }, 1, 0]
          }
        }
      }
    }
  ]);
  const inventoryStats = inventoryAggregate[0] || { totalProducts: 0, totalValue: 0, lowStock: 0, outOfStock: 0 };

  // Customer / Udhar stats
  const customerAggregate = await UdharEntry.aggregate([
    {
      $group: {
        _id: "$customer_name",
        lastActivity: { $max: "$date" },
        balance: {
          $sum: {
            $cond: [{ $eq: ["$type", "credit"] }, "$amount", { $multiply: ["$amount", -1] }]
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        totalCustomers: { $sum: 1 },
        activeCustomers: {
          $sum: {
            $cond: [{ $gte: ["$lastActivity", thirtyDaysAgo] }, 1, 0]
          }
        },
        pendingPaymentsCount: {
          $sum: {
            $cond: [{ $gt: ["$balance", 0] }, 1, 0]
          }
        },
        totalOutstanding: {
          $sum: "$balance"
        }
      }
    }
  ]);
  const customerStats = customerAggregate[0] || { totalCustomers: 0, activeCustomers: 0, pendingPaymentsCount: 0, totalOutstanding: 0 };

  // Orders/Shifts stats
  const totalOrders = await ShiftLog.countDocuments();
  const completedOrders = await ShiftLog.countDocuments({ status: "closed" });
  const pendingOrders = await ShiftLog.countDocuments({ status: "open" });

  return {
    shops: {
      total: totalShops,
      active: activeShops,
      inactive: inactiveShops,
      newShops,
      highestRevenue: await getShopsByRevenueOrder(-1, 5),
      lowestRevenue: await getShopsByRevenueOrder(1, 5)
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      owners: shopOwners,
      employees
    },
    sales: {
      totalSales: salesStats.totalUnitsSold,
      totalRevenue,
      totalProfit,
      totalExpenses,
      netProfit: totalProfit,
      averageSaleValue
    },
    inventory: {
      totalProducts: inventoryStats.totalProducts,
      totalValue: inventoryStats.totalValue,
      lowStock: inventoryStats.lowStock,
      outOfStock: inventoryStats.outOfStock
    },
    customers: {
      total: customerStats.totalCustomers,
      active: customerStats.activeCustomers,
      pendingPayments: customerStats.pendingPaymentsCount,
      totalOutstanding: customerStats.totalOutstanding
    },
    orders: {
      total: totalOrders,
      completed: completedOrders,
      pending: pendingOrders,
      cancelled: 0
    }
  };
};

const getShopsByRevenueOrder = async (order: 1 | -1, limit: number) => {
  const result = await DailyEntry.aggregate([
    { $match: { is_closed: true } },
    {
      $group: {
        _id: "$shop_id",
        revenue: { $sum: "$day_total_revenue" }
      }
    },
    {
      $lookup: {
        from: "shops",
        localField: "_id",
        foreignField: "_id",
        as: "shop"
      }
    },
    { $unwind: "$shop" },
    {
      $project: {
        _id: 1,
        name: "$shop.name",
        revenue: 1
      }
    },
    { $sort: { revenue: order } },
    { $limit: limit }
  ]);
  return result;
};

// 2. PLATFORM-WIDE CHARTS
export const getGlobalCharts = async () => {
  // Monthly Revenue & Profit (Past 12 months)
  const monthlyTrend = await DailyEntry.aggregate([
    { $match: { is_closed: true } },
    {
      $group: {
        _id: { $substr: ["$date", 0, 7] }, // YYYY-MM
        revenue: { $sum: "$day_total_revenue" },
        profit: { $sum: "$day_total_profit" },
        units_sold: { $sum: { $sum: "$products.units_sold" } }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 12 }
  ]);

  // Daily Trend (Past 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const dailyTrend = await DailyEntry.aggregate([
    { $match: { is_closed: true, date: { $gte: thirtyDaysAgoStr } } },
    {
      $group: {
        _id: "$date",
        revenue: { $sum: "$day_total_revenue" },
        profit: { $sum: "$day_total_profit" },
        units_sold: { $sum: { $sum: "$products.units_sold" } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Top Performing Shops
  const topShops = await DailyEntry.aggregate([
    { $match: { is_closed: true } },
    {
      $group: {
        _id: "$shop_id",
        totalRevenue: { $sum: "$day_total_revenue" },
        totalProfit: { $sum: "$day_total_profit" }
      }
    },
    {
      $lookup: {
        from: "shops",
        localField: "_id",
        foreignField: "_id",
        as: "shopInfo"
      }
    },
    { $unwind: "$shopInfo" },
    {
      $project: {
        name: "$shopInfo.name",
        totalRevenue: 1,
        totalProfit: 1
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 10 }
  ]);

  // Top Selling Products
  const topProducts = await DailyEntry.aggregate([
    { $match: { is_closed: true } },
    { $unwind: "$products" },
    {
      $group: {
        _id: "$products.product_name",
        unitsSold: { $sum: "$products.units_sold" },
        revenue: { $sum: "$products.revenue" }
      }
    },
    { $sort: { unitsSold: -1 } },
    { $limit: 10 }
  ]);

  // Expense Breakdown by Category
  const expenseBreakdown = await DailyEntry.aggregate([
    { $match: { is_closed: true } },
    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products.product_id",
        foreignField: "_id",
        as: "prodInfo"
      }
    },
    { $unwind: { path: "$prodInfo", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ["$prodInfo.category", "Uncategorized"] },
        expense: { $sum: { $multiply: ["$products.units_sold", "$products.active_buy_price"] } }
      }
    },
    {
      $project: {
        category: "$_id",
        value: { $round: ["$expense", 2] }
      }
    },
    { $sort: { value: -1 } }
  ]);

  // Shop growth trend
  const shopGrowth = await Shop.aggregate([
    {
      $group: {
        _id: { $substr: [{ $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, 0, 7] },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    monthlyTrend,
    dailyTrend,
    topShops,
    topProducts,
    expenseBreakdown,
    shopGrowth
  };
};

// 3. SHOP DIRECTORY (OPTIMIZED QUERY WITH AGGREGATION)
export const getShopsDirectory = async (options: {
  search?: string | undefined;
  is_active?: boolean | undefined;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  page: number;
  limit: number;
}) => {
  const query: Record<string, any> = {};

  if (options.is_active !== undefined) {
    query.is_active = options.is_active;
  }

  if (options.search) {
    query.$or = [
      { name: { $regex: options.search, $options: "i" } },
      { owner_name: { $regex: options.search, $options: "i" } },
      { phone: { $regex: options.search, $options: "i" } }
    ];
  }

  // Build Sort Option
  const sortOption: Record<string, any> = {};
  const sortBy = options.sortBy || "created_at";
  const order = options.sortOrder === "asc" ? 1 : -1;
  sortOption[sortBy] = order;

  const skipAmount = (options.page - 1) * options.limit;

  const shopsAggregate = await Shop.aggregate([
    { $match: query },
    // 1. Join DailyEntry for revenue, profit, shift count
    {
      $lookup: {
        from: "dailyentries",
        let: { shopId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$shop_id", "$$shopId"] }, is_closed: true } },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$day_total_revenue" },
              totalProfit: { $sum: "$day_total_profit" },
              ordersCount: { $sum: 1 }
            }
          }
        ],
        as: "salesMetrics"
      }
    },
    { $unwind: { path: "$salesMetrics", preserveNullAndEmptyArrays: true } },
    // 2. Join Product count
    {
      $lookup: {
        from: "products",
        let: { shopId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$shop_id", "$$shopId"] } } },
          { $count: "count" }
        ],
        as: "productMetrics"
      }
    },
    { $unwind: { path: "$productMetrics", preserveNullAndEmptyArrays: true } },
    // 3. Join User count (employees + owner)
    {
      $lookup: {
        from: "users",
        let: { shopId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$shop_id", "$$shopId"] } } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ],
        as: "userMetrics"
      }
    },
    { $unwind: { path: "$userMetrics", preserveNullAndEmptyArrays: true } },
    // 4. Join UdharEntry for outstanding and customer counts
    {
      $lookup: {
        from: "udharentries",
        let: { shopId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$shop_id", "$$shopId"] } } },
          {
            $group: {
              _id: "$customer_name",
              balance: {
                $sum: {
                  $cond: [{ $eq: ["$type", "credit"] }, "$amount", { $multiply: ["$amount", -1] }]
                }
              }
            }
          },
          {
            $group: {
              _id: null,
              customerCount: { $sum: 1 },
              totalOutstanding: { $sum: "$balance" }
            }
          }
        ],
        as: "udharMetrics"
      }
    },
    { $unwind: { path: "$udharMetrics", preserveNullAndEmptyArrays: true } },
    // 5. Project final shape
    {
      $project: {
        name: 1,
        owner_name: 1,
        phone: 1,
        address: 1,
        is_active: 1,
        created_at: 1,
        totalRevenue: { $ifNull: ["$salesMetrics.totalRevenue", 0] },
        totalProfit: { $ifNull: ["$salesMetrics.totalProfit", 0] },
        ordersCount: { $ifNull: ["$salesMetrics.ordersCount", 0] },
        productsCount: { $ifNull: ["$productMetrics.count", 0] },
        employeesCount: { $ifNull: ["$userMetrics.count", 0] },
        customersCount: { $ifNull: ["$udharMetrics.customerCount", 0] },
        totalOutstanding: { $ifNull: ["$udharMetrics.totalOutstanding", 0] }
      }
    },
    { $sort: sortOption },
    { $skip: skipAmount },
    { $limit: options.limit }
  ]);

  const total = await Shop.countDocuments(query);

  return {
    shops: shopsAggregate,
    total,
    pages: Math.ceil(total / options.limit),
    currentPage: options.page
  };
};

// 4. CREATE SHOP + OWNER
export const createShopWithOwner = async (payload: {
  name: string;
  owner_name: string;
  phone: string;
  address?: string;
  email?: string;
  password?: string;
}) => {
  const existingShop = await Shop.findOne({ phone: payload.phone });
  if (existingShop) {
    throw new HttpError(409, "A shop with this phone number already exists.");
  }

  if (payload.email) {
    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      throw new HttpError(409, "Email is already in use.");
    }
  }

  // Create Shop
  const shop = await Shop.create({
    name: payload.name.trim(),
    owner_name: payload.owner_name.trim(),
    phone: payload.phone.trim(),
    address: payload.address?.trim()
  });

  // Hash password
  const password = payload.password || "Password123";
  const password_hash = await bcrypt.hash(password, 10);

  // Create Owner
  const owner = await User.create({
    shop_id: shop._id,
    name: payload.owner_name.trim(),
    phone: payload.phone.trim(),
    email: payload.email?.trim().toLowerCase(),
    role: "owner",
    auth_provider: "password",
    password_hash,
    is_active: true
  });

  return {
    shop,
    owner: {
      _id: owner._id,
      name: owner.name,
      phone: owner.phone,
      email: owner.email,
      role: owner.role
    }
  };
};

// 5. UPDATE SHOP STATUS / DETAILS
export const updateShop = async (id: string, payload: any) => {
  const shop = await Shop.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!shop) {
    throw new HttpError(404, "Shop not found");
  }
  return shop;
};

// 6. RESET SHOP DATA
export const resetShopData = async (shop_id: string) => {
  const shopObjectId = new Types.ObjectId(shop_id);

  const shop = await Shop.findById(shopObjectId);
  if (!shop) {
    throw new HttpError(404, "Shop not found.");
  }

  // Delete all transaction logs
  await DailyEntry.deleteMany({ shop_id: shopObjectId });
  await ShiftLog.deleteMany({ shop_id: shopObjectId });
  await Product.deleteMany({ shop_id: shopObjectId });
  await UdharEntry.deleteMany({ shop_id: shopObjectId });
  await Alert.deleteMany({ shop_id: shopObjectId });
  await PriceHistoryLog.deleteMany({ shop_id: shopObjectId });
  await StockAdditionEvent.deleteMany({ shop_id: shopObjectId });

  // Delete worker users
  await User.deleteMany({ shop_id: shopObjectId, role: "worker" });

  // Reset owner user last login
  await User.updateMany({ shop_id: shopObjectId, role: "owner" }, { $unset: { last_login: "" }, is_active: true });

  return { message: "Shop data reset completed successfully." };
};

// 7. USER MANAGEMENT
export const listAllUsers = async (options: {
  search?: string | undefined;
  role?: string | undefined;
  is_active?: boolean | undefined;
  page: number;
  limit: number;
}) => {
  const query: Record<string, any> = {};

  if (options.role) {
    query.role = options.role;
  }

  if (options.is_active !== undefined) {
    query.is_active = options.is_active;
  }

  if (options.search) {
    query.$or = [
      { name: { $regex: options.search, $options: "i" } },
      { phone: { $regex: options.search, $options: "i" } },
      { email: { $regex: options.search, $options: "i" } }
    ];
  }

  const users = await User.find(query)
    .select("-password_hash")
    .populate("shop_id", "name")
    .sort({ created_at: -1 })
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);

  const total = await User.countDocuments(query);

  return {
    users,
    total,
    pages: Math.ceil(total / options.limit),
    currentPage: options.page
  };
};

export const updateUser = async (id: string, payload: any) => {
  const user = await User.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).select("-password_hash");
  if (!user) {
    throw new HttpError(404, "User not found.");
  }
  return user;
};

export const resetUserPassword = async (id: string, newPassword?: string) => {
  const password = newPassword || "ResetPassword123";
  const password_hash = await bcrypt.hash(password, 10);

  const user = await User.findByIdAndUpdate(id, { password_hash }, { new: true });
  if (!user) {
    throw new HttpError(404, "User not found.");
  }

  return { message: "Password reset completed." };
};

// 8. LOGS
export const listLogs = async (options: {
  search?: string | undefined;
  action?: string | undefined;
  page: number;
  limit: number;
}) => {
  const query: Record<string, any> = {};

  if (options.action) {
    query.action = options.action;
  }

  if (options.search) {
    query.$or = [
      { user_name: { $regex: options.search, $options: "i" } },
      { details: { $regex: options.search, $options: "i" } }
    ];
  }

  const logs = await ActivityLog.find(query)
    .populate("shop_id", "name")
    .sort({ created_at: -1 })
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);

  const total = await ActivityLog.countDocuments(query);

  return {
    logs,
    total,
    pages: Math.ceil(total / options.limit),
    currentPage: options.page
  };
};

// 9. ALERTS
export const listGlobalAlerts = async (options: {
  is_read?: boolean | undefined;
  page: number;
  limit: number;
}) => {
  const query: Record<string, any> = {};
  if (options.is_read !== undefined) {
    query.is_read = options.is_read;
  }

  const alerts = await Alert.find(query)
    .populate("shop_id", "name")
    .populate("product_id", "name")
    .sort({ created_at: -1 })
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);

  const total = await Alert.countDocuments(query);

  return {
    alerts,
    total,
    pages: Math.ceil(total / options.limit),
    currentPage: options.page
  };
};
