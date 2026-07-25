"use client";

import { useTranslations } from "next-intl";
import { BlobImage } from "./BlobImage";
import { Reveal } from "./motion/Reveal";
import { SCREEN_IMAGES } from "@/lib/images";

const BARS = [
  { id: "privacy", value: 98 },
  { id: "care", value: 92 },
  { id: "insight", value: 88 },
] as const;

export function Expertise() {
  const t = useTranslations("expertise");

  return (
    <section id="expertise" className="section section--surface !pt-2">
      <div className="container-page grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="text-center lg:text-start">
          <Reveal>
            <h2 className="section-title font-display">{t("title")}</h2>
            <p className="section-body mx-auto mb-6 lg:mx-0 lg:mb-8">
              {t("body")}
            </p>
          </Reveal>

          <div className="mb-6 space-y-4 text-start sm:mb-8 sm:space-y-5">
            {BARS.map(({ id, value }, i) => (
              <Reveal key={id} delay={0.06 * i}>
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-[var(--c-ink)]">
                  <span>{t(`bars.${id}`)}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${value}%` }}>
                    {value}%
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.16}>
            <a href="#download" className="btn btn-primary w-full sm:w-auto">
              {t("cta")}
            </a>
          </Reveal>
        </div>

        <Reveal delay={0.08} className="mx-auto max-w-[240px] sm:max-w-[280px] lg:max-w-none">
          <BlobImage src={SCREEN_IMAGES.expertise} alt={t("imageAlt")} />
        </Reveal>
      </div>
    </section>
  );
}
