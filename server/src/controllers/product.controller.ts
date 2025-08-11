import { AppDataSource } from "../config/database";
import { Request, Response } from "express";
import { Product } from "../entities/product.entity";

export const getProducts = async (req: Request, res: Response) => {
  const productRepo = AppDataSource.getRepository(Product);
  const products = await productRepo.find({ relations: ["category"] });
  res.json(products);
};

export const createProduct = async (req: Request, res: Response) => {
  const productRepo = AppDataSource.getRepository(Product);
  const product = productRepo.create(req.body);
  const saved = await productRepo.save(product);
  res.status(201).json(saved);
};
