import logoImage from "@/app/logo.png";

/** DoreHealth brand tokens — aligned with client/src/theme/variables.scss */
export const BRAND = {
  nameEn: "DoreHealth",
  nameFa: "دوره",
  sloganEn: "Understand your body, every day",
  sloganFa: "همراه سلامتی تو",
  descriptionFa:
    "سلامت زنان از آشنایی با بدنت شروع می‌شه. با اپلیکیشن دوره، چرخه قاعدگی، علائم، بارداری و سلامت روزانه‌ات رو با یادآورهای ملایم و حریم خصوصی روی دستگاه خودت دنبال کن.",
  descriptionEn:
    "Women's health starts with understanding your body. With DoreHealth, track your cycle, symptoms, pregnancy, and daily wellness with gentle reminders — private on your device.",
  /** Canonical app logo — `src/app/logo.png` */
  logo: logoImage,
  logoPath: logoImage.src,
} as const;

export const COLORS = {
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  primaryLight: "#818cf8",
  secondary: "#14b8a6",
  accent: "#ffd700",
  bg: "#f8fafc",
  surface: "#ffffff",
  text: "#0f172a",
  textSecondary: "#334155",
  navy: "#050a1a",
} as const;
