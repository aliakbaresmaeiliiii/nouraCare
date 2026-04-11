import * as dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || 3000,
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: Number(process.env.DB_PORT || 3306), // MySQL port
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '@Ali0011914505',
  DB_NAME: process.env.DB_NAME || 'muslimkids',
  JWT_SECRET: process.env.JWT_SECRET || 'nAnQoUUhgiK7XkucQxQ9i2NXjCwaWyNV',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
