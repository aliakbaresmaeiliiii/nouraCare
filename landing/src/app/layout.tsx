import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  weight: ["400", "600", "800"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://dorehealth.app"),
  title: `${BRAND.nameFa} | ${BRAND.sloganEn}`,
  description: BRAND.descriptionFa,
  icons: {
    icon: BRAND.logoPath,
    apple: BRAND.logoPath,
  },
  openGraph: {
    title: `${BRAND.nameFa} — ${BRAND.sloganFa}`,
    description: BRAND.descriptionFa,
    images: [{ url: BRAND.logoPath }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
