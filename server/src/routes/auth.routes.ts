import { Router } from "express";
import { AuthService } from "../services/auth.service";
import { Request, Response } from "express";
import { register } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
// router.post("/login", login);

export default router;
