"use client";

import { useTranslations } from "next-intl";
import { BlobImage } from "./BlobImage";
import { Reveal } from "./motion/Reveal";
import { SCREEN_IMAGES } from "@/lib/images";

const STATS = [
  { id: "users", accent: true },
  { id: "features", accent: false },
  { id: "stages", accent: false },
] as const;

export function About() {
  const t = useTranslations("about");

  return (
    <section id="about" className="section section--surface !pt-2 sm:!pt-4">
      <div className="container-page grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="order-2 flex justify-center lg:order-1 lg:justify-start">
          <Reveal className="mb-2 w-full max-w-[240px] sm:max-w-[280px] lg:max-w-[420px]">
            <BlobImage
              src={SCREEN_IMAGES.about}
              alt={t("imageAlt")}
              variant="alt"
              priority
            />
          </Reveal>
        </div>

        <div className="order-1 text-center lg:order-2 lg:text-start">
          <Reveal>
            <h2 className="section-title font-display">{t("title")}</h2>
            <p className="section-body mx-auto mb-6 lg:mx-0 lg:mb-8">
              {t("body")}
            </p>
          </Reveal>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {STATS.map(({ id, accent }, i) => (
              <Reveal key={id} delay={0.06 * i}>
                <div
                  className={`soft-card soft-card--organic px-2 py-3 text-center sm:px-4 sm:py-5 ${
                    accent ? "soft-card--accent" : ""
                  }`}
                >
                  <div
                    className={`font-display mb-0.5 text-lg font-semibold sm:mb-1 sm:text-3xl ${
                      accent ? "text-white" : "text-[var(--c-ink)]"
                    }`}
                  >
                    {t(`stats.${id}.value`)}
                  </div>
                  <div
                    className={`text-[0.7rem] font-medium leading-snug sm:text-sm ${
                      accent ? "text-white/85" : "text-[var(--c-ink-soft)]"
                    }`}
                  >
                    {t(`stats.${id}.label`)}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
