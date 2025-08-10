import { Router } from "express";
import { AuthService } from "../services/auth.service";

const router = Router();
const authService = new AuthService();

router.post("/register", async (req, res) => {
  try {
    const user = await authService.register(
      req.body.name,
      req.body.email,
      req.body.password
    );
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { token, user } = await authService.login(
      req.body.email,
      req.body.password
    );
    res.json({ token, user });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});
export default router;
