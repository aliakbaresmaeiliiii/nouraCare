import express from "express";
import productRoutes from "./src/routes/product.routes";
import { AppDataSource } from "./src/config/database";

const app = express();
app.use(express.json());

app.use("/api/v1/products", productRoutes);

AppDataSource.initialize()
  .then(() => console.log("✅ Database connected"))
  .catch((err) => console.error("❌ DB Connection error:", err));

export default app;
