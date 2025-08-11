import { AppDataSource } from "../config/database";
import { ProductCategory } from "../entities/product-categories";
import { Product } from "../entities/product.entity";

export class ProductService {
  private productRepo = AppDataSource.getRepository(Product);

  async createProduct(
    name: string,
    price: number,
    description: string,
    image: string,
    category: ProductCategory,
    stock: number
  ) {
    const product = this.productRepo.create({
      name,
      price,
      description,
      image,
      category,
      stock
    });
    await this.productRepo.save(product);
    return product;
  }
}
