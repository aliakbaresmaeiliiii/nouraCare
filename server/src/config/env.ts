import * as dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "gahvareh",
  JWT_SECRET: process.env.JWT_SECRET || "nAnQoUUhgiK7XkucQxQ9i2NXjCwaWyNV",
};
