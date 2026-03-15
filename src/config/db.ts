import mongoose from "mongoose";

export const connectDB = async (mongoUri: string): Promise<void> => {
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};
