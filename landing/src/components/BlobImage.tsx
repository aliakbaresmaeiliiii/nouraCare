import Image from "next/image";
import { Sparkle } from "lucide-react";

type BlobImageProps = {
  src: string;
  alt: string;
  variant?: "default" | "alt";
  priority?: boolean;
};

export function BlobImage({
  src,
  alt,
  variant = "default",
  priority = false,
}: BlobImageProps) {
  return (
    <div className="blob-frame">
      <div className="blob-frame__ring" aria-hidden />
      <div
        className={`blob-frame__media ${
          variant === "alt" ? "blob-frame__media--alt" : ""
        }`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 90vw, 420px"
          priority={priority}
          loading={priority ? undefined : "eager"}
        />
      </div>

      {/* Decorative leaves / flowers around the shape */}
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
    </div>
  );
}
