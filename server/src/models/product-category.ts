import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.model";

@Entity({ name: "gahvareh.product_categories" })

export class ProductCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  name!: string;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
