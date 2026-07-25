"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Sparkle } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";

const NAV = [
  { href: "#home", key: "home" as const },
  { href: "#about", key: "about" as const },
  { href: "#features", key: "features" as const },
  { href: "#faq", key: "faq" as const },
  { href: "#download", key: "download" as const },
];

export function Header() {
  const t = useTranslations("nav");
  const tBrand = useTranslations("brand");
  const locale = useLocale();
  const isRtl = locale === "fa";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuFrom = isRtl ? "-100%" : "100%";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-[var(--c-line)] bg-[var(--c-surface)]/95 shadow-sm backdrop-blur-xl"
          : "bg-transparent"
      }`}
      style={{ height: "var(--header-h)" }}
    >
      <div className="container-page flex h-full items-center justify-between gap-3">
        <a
          href="#home"
          className="flex min-w-0 items-center gap-2 no-underline sm:gap-2.5"
        >
          <Image
            src="/images/logo.png"
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-lg sm:size-9"
            priority
          />
          <span className="font-display truncate text-base font-semibold text-[var(--c-ink)] sm:text-[1.25rem]">
            {tBrand("name")}
          </span>
          <Sparkle
            className="hidden size-3.5 shrink-0 text-[var(--c-primary)] sm:inline"
            aria-hidden
          />
        </a>

        <nav
          className="hidden items-center justify-center gap-0.5 xl:flex"
          aria-label="Main"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-[var(--c-ink-soft)] no-underline transition hover:text-[var(--c-primary)]"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <a
            href="#download"
            className="btn btn-primary hidden !min-h-9 !px-3.5 !text-sm lg:inline-flex"
          >
            {t("download")}
          </a>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--c-line)] bg-[var(--c-surface)]/90 xl:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label={t("openMenu")}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-[var(--c-navy)]/50 backdrop-blur-sm xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          >
            <motion.aside
              role="dialog"
              aria-modal="true"
              initial={{ x: menuFrom }}
              animate={{ x: 0 }}
              exit={{ x: menuFrom }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className={`flex h-full w-[min(18.5rem,88vw)] flex-col bg-[var(--c-surface)] p-5 shadow-2xl sm:p-6 ${
                isRtl ? "me-auto" : "ms-auto"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-display text-lg font-semibold">
                  {tBrand("name")}
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-[var(--c-line)]"
                  aria-label={t("closeMenu")}
                >
                  <X className="size-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {NAV.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl px-4 py-3.5 text-base font-semibold text-[var(--c-ink)] no-underline hover:bg-[var(--c-indigo-soft)]"
                  >
                    {t(item.key)}
                  </a>
                ))}
              </nav>
              <div className="mt-auto space-y-3 pt-6">
                <LanguageSwitcher />
                <a
                  href="#download"
                  onClick={() => setMenuOpen(false)}
                  className="btn btn-primary w-full"
                >
                  {t("download")}
                </a>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
