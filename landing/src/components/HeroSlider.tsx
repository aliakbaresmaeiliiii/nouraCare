"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Sparkle } from "lucide-react";
import { HERO_SLIDES } from "@/lib/images";

type Props = {
  alt: string;
  /** Auto-advance interval in ms */
  intervalMs?: number;
};

export function HeroSlider({ alt, intervalMs = 3800 }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || HERO_SLIDES.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [paused, intervalMs]);

  return (
    <div
      className="blob-frame"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="blob-frame__ring" aria-hidden />
      <div className="blob-frame__media">
        {HERO_SLIDES.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={i === index ? alt : ""}
            fill
            className={`object-cover object-center transition-opacity duration-700 ease-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            sizes="(max-width: 768px) 90vw, 420px"
            priority={i === 0}
            loading={i === 0 ? undefined : "eager"}
            aria-hidden={i !== index}
          />
        ))}
      </div>

      {/* Decorative leaves / flowers */}
      <svg
        className="blob-frame__leaf"
        style={{ top: "8%", insetInlineStart: "-8%", transform: "rotate(-18deg)" }}
        viewBox="0 0 40 80"
        fill="none"
        aria-hidden
      >
        <path
          d="M20 4 C8 24 6 44 20 76 C34 44 32 24 20 4Z"
          fill="var(--c-secondary)"
          fillOpacity="0.55"
        />
        <path
          d="M20 10 C14 28 14 48 20 70"
          stroke="var(--c-ink)"
          strokeOpacity="0.15"
          strokeWidth="1"
        />
      </svg>
      <svg
        className="blob-frame__leaf"
        style={{
          bottom: "12%",
          insetInlineEnd: "-6%",
          width: "3.5rem",
          height: "5.5rem",
          transform: "rotate(22deg)",
        }}
        viewBox="0 0 40 80"
        fill="none"
        aria-hidden
      >
        <path
          d="M20 4 C8 24 6 44 20 76 C34 44 32 24 20 4Z"
          fill="var(--c-primary-light)"
          fillOpacity="0.65"
        />
      </svg>

      <span className="blob-frame__dot" style={{ top: "18%", insetInlineEnd: "2%" }} />
      <span
        className="blob-frame__dot"
        style={{
          bottom: "22%",
          insetInlineStart: "4%",
          background: "var(--c-secondary)",
        }}
      />
      <Sparkle
        className="blob-frame__spark size-5"
        style={{ top: "6%", insetInlineEnd: "14%" }}
        aria-hidden
      />
      <Sparkle
        className="blob-frame__spark size-4"
        style={{
          bottom: "10%",
          insetInlineStart: "16%",
          color: "var(--c-secondary)",
        }}
        aria-hidden
      />
      <Sparkle
        className="blob-frame__spark size-3.5"
        style={{
          top: "42%",
          insetInlineStart: "-2%",
          color: "var(--c-accent)",
        }}
        aria-hidden
      />

      {/* Dots */}
      <div
        className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5 sm:bottom-4"
        role="tablist"
        aria-label="Hero images"
      >
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index
                ? "w-5 bg-[var(--c-primary)]"
                : "w-1.5 bg-[var(--c-primary)]/35 hover:bg-[var(--c-primary)]/55"
            }`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
