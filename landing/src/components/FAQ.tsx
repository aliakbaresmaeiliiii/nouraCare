"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Reveal } from "./motion/Reveal";
import { Wave } from "./Wave";

export function FAQ() {
  const t = useTranslations("faq");
  const items = t.raw("items") as { q: string; a: string }[];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative">
      <div className="section section--tint !pt-4">
        <div className="container-page max-w-3xl">
          <Reveal className="mb-7 text-center sm:mb-10">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--c-secondary)] sm:text-sm">
              {t("eyebrow")}
            </p>
            <h2 className="section-title font-display">{t("title")}</h2>
            <p className="section-body mx-auto">{t("subtitle")}</p>
          </Reveal>

          <div className="space-y-2.5 sm:space-y-3">
            {items.map((item, i) => {
              const open = openIndex === i;
              return (
                <Reveal key={item.q} delay={0.02 * i}>
                  <div className="soft-card overflow-hidden">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start sm:gap-4 sm:px-5 sm:py-4"
                      onClick={() => setOpenIndex(open ? null : i)}
                      aria-expanded={open}
                    >
                      <span className="font-display text-sm font-semibold leading-snug text-[var(--c-ink)] sm:text-base">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`size-5 shrink-0 text-[var(--c-muted)] transition ${
                          open ? "rotate-180 text-[var(--c-primary)]" : ""
                        }`}
                        aria-hidden
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {open ? (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.28,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <p className="m-0 border-t border-[var(--c-line)] px-5 py-4 text-sm leading-relaxed text-[var(--c-muted)]">
                            {item.a}
                          </p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
      <Wave from="var(--c-indigo-soft)" to="var(--c-surface)" />
    </section>
  );
}
