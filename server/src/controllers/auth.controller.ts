import { AuthService } from "../services/auth.service";

const authService = new AuthService();

export const register = async (req: any, res: any) => {
  try {
    if (!req.body?.email || !req.body?.phone) {
      return res.status(400).json({ message: "Email and phone are required" });
    }
    const { email, phone } = req.body;
    const user = await authService.register(email, phone);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// router.post("/login", async (req, res) => {
//   try {
//     const { token, user } = await authService.login(
//       req.body.email,
//       req.body.password
//     );
//     res.json({ token, user });
//   } catch (err: any) {
//     res.status(400).json({ message: err.message });
//   }
// });
