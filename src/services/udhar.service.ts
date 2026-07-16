import mongoose from "mongoose";
import { UdharEntry } from "../models/udhar.model";
import { HttpError } from "../utils/http-error";

type CreateUdharInput = {
  shop_id: string;
  recorded_by: string;
  customer_name: string;
  customer_phone?: string;
  type: "credit" | "payment";
  amount: number;
  packets?: number;
  description?: string;
  date?: string | Date;
};

export const createUdharEntry = async (payload: CreateUdharInput) => {
  const {
    shop_id,
    recorded_by,
    customer_name,
    customer_phone,
    type,
    amount,
    packets,
    description,
    date,
  } = payload;

  if (!customer_name || !customer_name.trim()) {
    throw new HttpError(400, "Customer name is required");
  }

  if (!["credit", "payment"].includes(type)) {
    throw new HttpError(400, "Type must be 'credit' or 'payment'");
  }

  if (amount <= 0) {
    throw new HttpError(400, "Amount must be greater than zero");
  }

  const parsedDate = date ? new Date(date) : new Date();

  return UdharEntry.create({
    shop_id: new mongoose.Types.ObjectId(shop_id),
    recorded_by: new mongoose.Types.ObjectId(recorded_by),
    customer_name: customer_name.trim(),
    customer_phone: customer_phone ? customer_phone.trim() : null,
    type,
    amount,
    packets: packets || 0,
    description: description ? description.trim() : null,
    date: parsedDate,
  });
};

export const getUdharCustomers = async (
  shopId: string,
  userId: string,
  role: "owner" | "worker",
  recordedBy?: string
) => {
  const matchStage: any = { shop_id: new mongoose.Types.ObjectId(shopId) };

  if (role === "worker") {
    matchStage.recorded_by = new mongoose.Types.ObjectId(userId);
  } else if (role === "owner" && recordedBy) {
    matchStage.recorded_by = new mongoose.Types.ObjectId(recordedBy);
  }

  const customers = await UdharEntry.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          name: { $trim: { input: "$customer_name" } },
          phone: "$customer_phone",
        },
        net_balance: {
          $sum: {
            $cond: [
              { $eq: ["$type", "credit"] },
              "$amount",
              { $multiply: ["$amount", -1] },
            ],
          },
        },
        last_transaction_date: { $max: "$date" },
      },
    },
    {
      $project: {
        _id: 0,
        customer_name: "$_id.name",
        customer_phone: "$_id.phone",
        net_balance: 1,
        last_transaction_date: 1,
      },
    },
    { $sort: { last_transaction_date: -1 } },
  ]);

  return customers;
};

export const getUdharTransactions = async (
  shopId: string,
  userId: string,
  role: "owner" | "worker",
  customerName?: string,
  recordedBy?: string
) => {
  const query: any = { shop_id: new mongoose.Types.ObjectId(shopId) };

  if (role === "worker") {
    query.recorded_by = new mongoose.Types.ObjectId(userId);
  } else if (role === "owner" && recordedBy) {
    query.recorded_by = new mongoose.Types.ObjectId(recordedBy);
  }

  if (customerName) {
    query.customer_name = { $regex: new RegExp("^" + customerName.trim() + "$", "i") };
  }

  return UdharEntry.find(query)
    .populate("recorded_by", "name")
    .sort({ date: -1, created_at: -1 });
};

export const deleteUdharEntry = async (
  entryId: string,
  shopId: string,
  userId: string,
  role: "owner" | "worker"
) => {
  if (!mongoose.isValidObjectId(entryId)) {
    throw new HttpError(400, "Invalid entry ID");
  }

  const entry = await UdharEntry.findById(entryId);

  if (!entry) {
    throw new HttpError(404, "Udhar entry not found");
  }

  if (entry.shop_id.toString() !== shopId) {
    throw new HttpError(403, "Access denied. Entry belongs to a different shop.");
  }

  if (role !== "owner" && entry.recorded_by.toString() !== userId) {
    throw new HttpError(403, "Access denied. Workers can only delete their own entries.");
  }

  await entry.deleteOne();
  return { success: true, message: "Entry deleted successfully" };
};
