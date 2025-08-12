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

export const verifyEmail = async (req: any, res: any) => {
  try {
    if (!req.body.verify_code || !req.body.email) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required" });
    }
    const { email, verify_code } = req.body;
    const user = await authService.verifyEmail(email, verify_code);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const signIn = async (req: any, res: any) => {
  try {
    if (!req.body?.email ) {
      return res
        .status(400)
        .json({ message: "Email is required" });
    }
    const { email } = req.body;
    const { token, user } = await authService.login(email);
    res.json({ token, user });
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
