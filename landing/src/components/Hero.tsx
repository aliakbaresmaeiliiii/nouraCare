"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { HeroSlider } from "./HeroSlider";
import { Wave } from "./Wave";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section id="home" className="section--hero relative overflow-hidden">
      <div className="container-page grid items-center gap-8 pb-6 pt-[calc(var(--header-h)+1.5rem)] sm:gap-10 sm:pb-8 sm:pt-[calc(var(--header-h)+2.25rem)] lg:grid-cols-2 lg:gap-14 lg:pb-4 lg:pt-[calc(var(--header-h)+3rem)]">
        {/* Content first on mobile for readability */}
        <div className="text-center lg:text-start">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="font-display mx-auto mb-4 max-w-xl text-[clamp(1.75rem,6.2vw,3.5rem)] leading-[1.18] text-[var(--c-ink)] lg:mx-0"
          >
            {t("headline")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="section-body mx-auto mb-6 max-w-md lg:mx-0 lg:mb-8"
          >
            {t("description")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14 }}
            className="flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <a href="#about" className="btn btn-primary min-w-[9.5rem]">
              {t("ctaPrimary")}
            </a>
            <a
              href="#features"
              className="btn-play"
              aria-label={t("ctaSecondary")}
            >
              <Play className="size-4 fill-current" aria-hidden />
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:max-w-none"
        >
          <HeroSlider alt={t("imageAlt")} />
        </motion.div>
      </div>

      <Wave from="var(--c-bg)" to="var(--c-surface)" />
    </section>
  );
}
