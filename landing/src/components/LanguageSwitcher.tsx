"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, routing, type Locale } from "@/i18n/routing";
import { ChevronDown, Globe } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function switchLocale(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-line)] bg-white/70 px-3 py-2 text-sm font-semibold text-[var(--c-ink)] backdrop-blur transition hover:bg-white"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="size-4 text-[var(--c-teal)]" aria-hidden />
        <span>{localeLabels[locale]}</span>
        <ChevronDown
          className={`size-4 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute end-0 z-50 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-[var(--c-line)] bg-white py-1 shadow-[var(--c-shadow)]"
          >
            {routing.locales.map((l) => (
              <li key={l} role="option" aria-selected={l === locale}>
                <button
                  type="button"
                  onClick={() => switchLocale(l)}
                  className={`flex w-full px-4 py-2.5 text-start text-sm font-medium transition hover:bg-[var(--c-indigo-soft)] ${
                    l === locale
                      ? "bg-[var(--c-indigo-soft)] text-[var(--c-primary)]"
                      : "text-[var(--c-ink-soft)]"
                  }`}
                >
                  {localeLabels[l]}
                </button>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
