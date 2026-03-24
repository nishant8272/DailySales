import mongoose from "mongoose";

export const connectDB = async (mongoUri: string) => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};