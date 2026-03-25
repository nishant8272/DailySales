import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import shopRoutes from "./routes/shop.routes";
import userRoutes from "./routes/user.routes";
import product from "./routes/product.routes";
import shiftRoutes from "./routes/Shift.routes";
import reportRoutes from "./routes/report.routes";
import alertRoutes from "./routes/alert.routes";

const app = express();

const PORT = Number(process.env.PORT || 3000);
const MONGO_URI = process.env.MONGODB_URL;
if (!MONGO_URI) {
    console.error("MONGODB_URL is not defined in environment variables");
    process.exit(1);
}

app.use(express.json());
app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    })
);

app.get("/", (_req, res) => {
    res.send("DailySales backend running");
});

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/shops", shopRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", product);
app.use("/api/shifts", shiftRoutes)
app.use("/api/reports", reportRoutes);
app.use("/api/alerts",  alertRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

connectDB(MONGO_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB", error);
        process.exit(1);
    });
