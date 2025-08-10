import { AppDataSource } from "../config/database";
import { env } from "../config/env";
import { User } from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private jwtSecret = env.JWT_SECRET;

  async register(name: string, email: string, password: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new Error("Email already registered");

    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ name, email, passwrod: hashed });
    return this.userRepo.save(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new Error("User not found");

    const valid = await bcrypt.compare(password, user.passwrod);
    if (!valid) throw new Error("Invalid password");

    const token = jwt.sign({ id: user.id }, this.jwtSecret, {
      expiresIn: "1d",
    });
    return { token, user };
  }
}
