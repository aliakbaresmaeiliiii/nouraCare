"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Sparkle } from "lucide-react";
import { Wave } from "./Wave";

const NAV_LINKS = [
  { href: "#about", key: "about" as const },
  { href: "#features", key: "features" as const },
  { href: "#faq", key: "faq" as const },
  { href: "#download", key: "download" as const },
];

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tBrand = useTranslations("brand");
  const year = new Date().getFullYear();

  return (
    <footer className="relative">
      <div className="bg-[var(--c-indigo-soft)] pb-8 pt-2 sm:pb-10">
        <div className="container-page">
          <div className="flex flex-col items-center gap-6 text-center sm:gap-7">
            <a
              href="#home"
              className="inline-flex items-center gap-2.5 no-underline"
            >
              <Image
                src="/images/logo.png"
                alt=""
                width={36}
                height={36}
                className="size-9 rounded-lg"
              />
              <span className="font-display text-lg font-semibold text-[var(--c-ink)] sm:text-[1.25rem]">
                {tBrand("name")}
              </span>
              <Sparkle
                className="size-3.5 text-[var(--c-primary)]"
                aria-hidden
              />
            </a>

            <p className="m-0 max-w-sm text-sm leading-relaxed text-[var(--c-ink-soft)] sm:text-base">
              {t("tagline")}
            </p>

            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center justify-center gap-0.5"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-2 text-sm font-medium text-[var(--c-ink-soft)] no-underline transition hover:text-[var(--c-primary)]"
                >
                  {tNav(link.key)}
                </a>
              ))}
            </nav>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[var(--c-line)] pt-6 text-sm text-[var(--c-muted)] sm:mt-10 sm:flex-row">
            <p className="m-0">
              © {year} {tBrand("name")} — {t("rights")}
            </p>
            <div className="flex items-center gap-5">
              <a
                href="#about"
                className="font-medium text-[var(--c-muted)] no-underline transition hover:text-[var(--c-primary)]"
              >
                {t("privacy")}
              </a>
              <a
                href="#about"
                className="font-medium text-[var(--c-muted)] no-underline transition hover:text-[var(--c-primary)]"
              >
                {t("terms")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
