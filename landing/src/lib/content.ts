export type Feature = {
  id: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  descriptionEn: string;
  icon: string;
};

export const MAIN_FEATURES: Feature[] = [
  {
    id: "cycle",
    titleFa: "ردیابی پریود",
    titleEn: "Period Tracking",
    descriptionFa:
      "تقویم شخصی چرخه قاعدگی، پیش‌بینی پریود بعدی و ثبت روزهای باروری با دقت بالا.",
    descriptionEn:
      "Personal cycle calendar, next-period predictions, and fertile-day insights.",
    icon: "calendar",
  },
  {
    id: "symptoms",
    titleFa: "ثبت علائم",
    titleEn: "Symptom Logging",
    descriptionFa:
      "ثبت روزانه حالت، انرژی و علائم برای دیدن الگوها و یادآورهای هوشمند.",
    descriptionEn:
      "Log mood, energy, and symptoms daily to spot patterns and get smart reminders.",
    icon: "pulse",
  },
  {
    id: "pregnancy",
    titleFa: "حالت بارداری",
    titleEn: "Pregnancy Mode",
    descriptionFa:
      "پیگیری هفته‌به‌هفته بارداری، شمارش لگد، نمودار رشد و ابزارهای آماده‌سازی تولد.",
    descriptionEn:
      "Week-by-week pregnancy tracking, kick counter, growth charts, and birth prep tools.",
    icon: "baby",
  },
  {
    id: "consultation",
    titleFa: "مشاوره تخصصی",
    titleEn: "Expert Consultations",
    descriptionFa:
      "ارتباط با متخصصان سلامت زنان برای راهنمایی شخصی‌سازی‌شده در هر مرحله.",
    descriptionEn:
      "Connect with women's health specialists for personalized guidance at every stage.",
    icon: "stethoscope",
  },
  {
    id: "education",
    titleFa: "آموزش جامع",
    titleEn: "Education Library",
    descriptionFa:
      "دسترسی به مقالات و دوره‌های تخصصی درباره چرخه، بارداری، تغذیه و سلامت روان.",
    descriptionEn:
      "Expert articles and courses on cycles, pregnancy, nutrition, and mental wellness.",
    icon: "book",
  },
  {
    id: "community",
    titleFa: "جامعه حمایتی",
    titleEn: "Supportive Community",
    descriptionFa:
      "گفت‌وگو با زنان هم‌مسیر، اشتراک تجربه و یادگیری در فضایی امن و مدیریت‌شده.",
    descriptionEn:
      "Talk with women on similar journeys in a safe, moderated community space.",
    icon: "people",
  },
];

export const OTHER_FEATURES = [
  {
    fa: "یادآورهای ملایم برای پریود، دارو و قرارها",
    en: "Gentle reminders for periods, medication, and appointments",
  },
  {
    fa: "حریم خصوصی — داده‌ها روی دستگاه شما",
    en: "Privacy-first — your data stays on your device",
  },
  {
    fa: "ردیابی باروری و برنامه‌ریزی بارداری",
    en: "Fertility tracking and pregnancy planning",
  },
  {
    fa: "لیست کیف بیمارستان و چک‌لیست نوزاد",
    en: "Hospital bag checklist and newborn layette list",
  },
  {
    fa: "انتخاب نام نوزاد و آلبوم خاطرات",
    en: "Baby name picker and memory album",
  },
  {
    fa: "دستیار هوشمند سلامت زنان",
    en: "AI women's health assistant",
  },
];
