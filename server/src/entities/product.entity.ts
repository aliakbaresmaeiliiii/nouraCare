import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { ProductCategory } from "./product-categories";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  name!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price!: number;

  @Column({ nullable: true })
  image!: string;



  @Column()
  stock!: number;
  @Column()
  description!: string;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => ProductCategory, (category) => category.products, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "category_id" })
  @Column({ nullable: true })
  category!: ProductCategory;
}
