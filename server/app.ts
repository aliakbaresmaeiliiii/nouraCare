import express from "express";
import productRoutes from "./src/routes/product.routes";
import { AppDataSource } from "./src/config/database";
import authRoutes from "./src/routes/auth.routes";
import cors from "cors";
import { allowedOrigins } from "./src/constants/constants-allowed-orginal";
import { prisma } from "./src/config/prisma";

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

(async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected with Prisma");
  } catch (error) {
    console.error("❌ DB Connection error:", error);
  }
})();

export default app;
