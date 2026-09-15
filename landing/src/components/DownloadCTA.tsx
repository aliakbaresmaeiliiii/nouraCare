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
    tone: "brand" as const,
  },
  {
    key: "bazaar" as const,
    href: STORE_URLS.bazaar,
    icon: CafeBazaarIcon,
    tone: "brand" as const,
  },
  {
    key: "appStore" as const,
    href: STORE_URLS.appStore,
    icon: AppStoreIcon,
    tone: "brand" as const,
  },
  {
    key: "pwa" as const,
    href: APP_URL,
    icon: PwaIcon,
    tone: "brand" as const,
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
              <p className="mb-7 text-sm leading-relaxed text-white/85 sm:mb-9 sm:text-base">
                {t("subtitle")}
              </p>

              <div className="mx-auto grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5">
                {STORES.map(({ key, href, icon: Icon, tone }) => (
                  <a
                    key={key}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href.startsWith("http") ? "noopener noreferrer" : undefined
                    }
                    className="flex min-h-17 items-center gap-3.5 rounded-2xl border border-white/30 bg-white px-4 py-3.5 text-start text-ink shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:min-h-18 sm:gap-4 sm:px-5"
                  >
                    <span
                      className={
                        tone === "brand"
                          ? "flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface shadow-sm ring-1 ring-black/5 sm:size-14"
                          : "flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#111827] text-white shadow-sm sm:size-14"
                      }
                    >
                      <Icon
                        className={
                          tone === "brand"
                            ? "size-7 sm:size-8"
                            : "size-7 text-white sm:size-8"
                        }
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted sm:text-xs">
                        {t("getOn")}
                      </span>
                      <span className="mt-0.5 block truncate text-base font-bold leading-snug sm:text-lg">
                        {t(key)}
                      </span>
                    </span>
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
