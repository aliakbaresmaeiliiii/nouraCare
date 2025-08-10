import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { ProductCategory } from "./product-category";

@Entity({ name: "gahvareh.products" })
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
  seller_id!: number;

  @Column()
  stock!: number;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => ProductCategory, (category) => category.products, { onDelete: "SET NULL" })
  category!: ProductCategory;
}
