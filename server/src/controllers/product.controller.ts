import { AppDataSource } from "../config/database";
import { Product } from "../models/product.model";
import { Request, Response } from "express";

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
