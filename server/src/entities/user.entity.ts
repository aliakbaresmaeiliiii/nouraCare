// src/entities/user.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @Column({ unique: true })
  email: string = "";

  @Column({ nullable: true })
  verificationCode!: string | null;

  @Column({ default: false })
  isVerified: boolean = false;

  @Column({ unique: true })
  phone: string = "";

  @CreateDateColumn()
  created_at: Date = new Date();
}
