import { Router } from "express";
import { register, signIn, verifyEmail } from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/sign-in", signIn);

export default router;
