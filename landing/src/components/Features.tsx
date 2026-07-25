"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  Activity,
  Baby,
  Stethoscope,
  ArrowUpRight,
} from "lucide-react";
import { Reveal } from "./motion/Reveal";
import { Wave } from "./Wave";
import { SCREEN_IMAGES } from "@/lib/images";

const ITEMS = [
  {
    id: "cycle" as const,
    icon: CalendarDays,
    featured: false,
    image: SCREEN_IMAGES.features.cycle,
  },
  {
    id: "symptoms" as const,
    icon: Activity,
    featured: true,
    image: SCREEN_IMAGES.features.symptoms,
  },
  {
    id: "pregnancy" as const,
    icon: Baby,
    featured: false,
    image: SCREEN_IMAGES.features.pregnancy,
  },
  {
    id: "consultation" as const,
    icon: Stethoscope,
    featured: false,
    image: SCREEN_IMAGES.features.consultation,
  },
];

export function Features() {
  const t = useTranslations("features");

  return (
    <section id="features" className="relative">
      <div className="section section--tint !pt-4 sm:!pt-6">
        <div className="container-page">
          <Reveal className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
            <h2 className="section-title font-display !mb-3">{t("title")}</h2>
            <p className="section-body mx-auto">{t("subtitle")}</p>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {ITEMS.map(({ id, icon: Icon, featured, image }, i) => (
              <Reveal key={id} delay={0.04 * i}>
                <article
                  className={`group flex h-full overflow-hidden rounded-[1.35rem] transition duration-300 sm:flex-col ${
                    featured
                      ? "soft-card--accent shadow-[0_16px_36px_rgba(99,102,241,0.24)]"
                      : "soft-card hover:shadow-[var(--c-shadow)]"
                  }`}
                >
                  {/* Mobile: compact side thumb · Desktop: tall preview */}
                  <div className="screen-thumb relative aspect-square w-[7.25rem] shrink-0 self-stretch overflow-hidden sm:mx-4 sm:mt-4 sm:w-auto sm:rounded-2xl">
                    <Image
                      src={image}
                      alt={t(`items.${id}.title`)}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 640px) 116px, (max-width: 1024px) 45vw, 220px"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5 sm:pt-4">
                    <div
                      className={`mb-2 inline-flex size-9 items-center justify-center rounded-xl sm:mb-3 sm:size-10 ${
                        featured
                          ? "bg-white/15 text-white"
                          : "bg-[var(--c-indigo-soft)] text-[var(--c-primary)]"
                      }`}
                    >
                      <Icon className="size-4" aria-hidden />
                    </div>
                    <h3
                      className={`font-display mb-1.5 text-base font-semibold sm:mb-2 sm:text-lg ${
                        featured ? "text-white" : "text-[var(--c-ink)]"
                      }`}
                    >
                      {t(`items.${id}.title`)}
                    </h3>
                    <p
                      className={`mb-3 line-clamp-3 flex-1 text-sm leading-relaxed sm:mb-4 sm:line-clamp-none ${
                        featured ? "text-white/85" : "text-[var(--c-ink-soft)]"
                      }`}
                    >
                      {t(`items.${id}.description`)}
                    </p>
                    <a
                      href="#download"
                      className={`inline-flex items-center gap-1 text-sm font-bold no-underline ${
                        featured
                          ? "text-white"
                          : "text-[var(--c-primary)] hover:text-[var(--c-primary-dark)]"
                      }`}
                    >
                      {t("learnMore")}
                      <ArrowUpRight className="size-4" aria-hidden />
                    </a>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
      <Wave from="var(--c-indigo-soft)" to="var(--c-surface)" />
    </section>
  );
}
