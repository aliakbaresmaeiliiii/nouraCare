"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PageSkeleton } from "./PageSkeleton";

type Props = {
  children: ReactNode;
  /** Min time to show skeleton so it doesn’t flash (ms) */
  minMs?: number;
};

/**
 * Shows a full-page skeleton until hydration + hero image preload,
 * then reveals the real page with a short fade.
 */
export function PageLoader({ children, minMs = 450 }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const started = performance.now();

    const finish = () => {
      if (cancelled) return;
      const wait = Math.max(0, minMs - (performance.now() - started));
      window.setTimeout(() => {
        if (!cancelled) setReady(true);
      }, wait);
    };

    const preload = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      });

    Promise.all([
      preload("/images/human/hero-avatar.png"),
      preload("/images/human/about.png"),
      preload("/images/human/expertise.png"),
      preload("/images/human/hero-calm.png"),
      preload("/images/logo.png"),
      typeof document !== "undefined" && document.fonts?.ready
        ? document.fonts.ready.catch(() => undefined)
        : Promise.resolve(),
    ]).then(finish);

    // Safety: never block forever
    const fallback = window.setTimeout(finish, 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [minMs]);

  return (
    <>
      <div
        className={`page-loader-overlay ${ready ? "page-loader-overlay--done" : ""}`}
        aria-hidden={ready}
      >
        <PageSkeleton />
      </div>
      <div
        className={`page-loader-content ${ready ? "page-loader-content--ready" : ""}`}
      >
        {children}
      </div>
    </>
  );
}
