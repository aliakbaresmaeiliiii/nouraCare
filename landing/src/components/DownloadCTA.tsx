"use client";

import { useTranslations } from "next-intl";
import { APP_URL, STORE_URLS } from "@/lib/links";
import { Reveal } from "./motion/Reveal";
import {
  AppStoreIcon,
  CafeBazaarIcon,
  GooglePlayIcon,
  PwaIcon,
} from "./StoreIcons";

const STORES = [
  {
    key: "play" as const,
    href: STORE_URLS.play,
    icon: GooglePlayIcon,
    brand: true,
  },
  {
    key: "bazaar" as const,
    href: STORE_URLS.bazaar,
    icon: CafeBazaarIcon,
    brand: true,
  },
  {
    key: "appStore" as const,
    href: STORE_URLS.appStore,
    icon: AppStoreIcon,
    brand: false,
  },
  {
    key: "pwa" as const,
    href: APP_URL,
    icon: PwaIcon,
    brand: false,
  },
];

export function DownloadCTA() {
  const t = useTranslations("download");

  return (
    <section id="download" className="section section--surface !pt-2 !pb-10 sm:!pb-16">
      <div className="container-page">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-[1.5rem] px-5 py-10 text-white sm:rounded-[2rem] sm:px-10 sm:py-14"
            style={{ background: "var(--gradient-brand)" }}
          >
            <div className="pointer-events-none absolute -end-16 -top-20 size-56 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute -start-10 bottom-0 size-44 rounded-full bg-[var(--c-accent)]/20 blur-3xl" />

            <div className="relative mx-auto max-w-2xl text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/80 sm:mb-3 sm:text-sm">
                {t("eyebrow")}
              </p>
              <h2 className="font-display mb-3 text-[clamp(1.5rem,5vw,2.6rem)] font-semibold leading-tight sm:mb-4">
                {t("title")}
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-white/85 sm:mb-8 sm:text-base">
                {t("subtitle")}
              </p>
              <div className="mx-auto grid max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                {STORES.map(({ key, href, icon: Icon, brand }) => (
                  <a
                    key={key}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href.startsWith("http") ? "noopener noreferrer" : undefined
                    }
                    className="btn w-full border border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                  >
                    <Icon
                      className={brand ? "size-5 shrink-0 rounded-[0.3rem]" : "size-5 shrink-0"}
                    />
                    {t(key)}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
