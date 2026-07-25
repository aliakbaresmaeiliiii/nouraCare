import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Vazirmatn, Fraunces, DM_Sans } from "next/font/google";
import { localeDirection, routing, type Locale } from "@/i18n/routing";
import "../globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dorehealth.ir";

  return {
    metadataBase: new URL(siteUrl),
    title: t("title"),
    description: t("description"),
    icons: {
      icon: "/images/logo.png",
      apple: "/images/logo.png",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      images: [{ url: "/images/logo.png" }],
      locale,
      type: "website",
    },
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = localeDirection[locale as Locale];
  const isFa = locale === "fa";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${vazirmatn.variable} ${fraunces.variable} ${dmSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="site-shell min-h-full antialiased"
        style={
          {
            "--font-body": isFa
              ? "var(--font-vazirmatn)"
              : "var(--font-dm-sans)",
            "--font-display": isFa
              ? "var(--font-vazirmatn)"
              : "var(--font-fraunces)",
          } as CSSProperties
        }
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
