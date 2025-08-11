import { DataSource } from "typeorm";
import { env } from "./env";
import { User } from "../entities/user.entity";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  // entities: [__dirname + "/../entities/*{.ts,.js}"],
  entities: [User],
  synchronize: env.NODE_ENV ==='development',
  migrations:[__dirname + "/../migrations/*{.ts,.js}"],
   dropSchema: true,
});
