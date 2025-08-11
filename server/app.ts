import express from "express";
import productRoutes from "./src/routes/product.routes";
import { AppDataSource } from "./src/config/database";
import authRoutes from "./src/routes/auth.routes";
import cors from "cors";
import { allowedOrigins } from "./src/constants/constants-allowed-orginal";

const app = express();
app.use(express.json());

const optCors: cors.CorsOptions = {
  origin: allowedOrigins,
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};
app.use(cors(optCors));

app.use("/api/v1/products", productRoutes);
app.use("/api/v1/auth", authRoutes);




app.use(
  express.json({
    limit: "200mb",
    type: "application/json",
  })
);

AppDataSource.initialize()
  .then(() => console.log("✅ Database connected"))
  .catch((err) => console.error("❌ DB Connection error:", err));

export default app;
