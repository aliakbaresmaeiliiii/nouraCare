import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fa", "en", "zh", "ms"],
  defaultLocale: "fa",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  fa: "rtl",
  en: "ltr",
  zh: "ltr",
  ms: "ltr",
};

export const localeLabels: Record<Locale, string> = {
  fa: "فارسی",
  en: "English",
  zh: "中文",
  ms: "Bahasa Melayu",
};
