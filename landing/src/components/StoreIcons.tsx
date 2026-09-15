import Image from "next/image";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Official-style Google Play triangle mark */
export function GooglePlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path fill="#00C3FF" d="M3.2 2.1v19.8L13.1 12 3.2 2.1Z" />
      <path fill="#FFD400" d="M16.7 9.9 13.1 12 3.2 2.1l13.5 7.8Z" />
      <path fill="#FF3A44" d="M16.7 14.1 3.2 21.9 13.1 12l3.6 2.1Z" />
      <path
        fill="#00F076"
        d="M20.5 10.95c.7.4.7 1.1 0 1.5l-3.8 2.2L13.1 12l3.6-2.1 3.8 1.05Z"
      />
    </svg>
  );
}

/** Cafe Bazaar brand mark */
export function CafeBazaarIcon({ className }: IconProps) {
  return (
    <Image
      src="/cafebazar.png"
      alt=""
      width={32}
      height={32}
      className={className}
      aria-hidden
    />
  );
}

/** App Store — blue badge with classic “A” (brush / pen / ruler) mark */
export function AppStoreIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <defs>
        <linearGradient id="store-appstore-bg" x1="4" y1="2" x2="20" y2="22">
          <stop stopColor="#5AC8FA" />
          <stop offset="0.45" stopColor="#007AFF" />
          <stop offset="1" stopColor="#5856D6" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="5.5" fill="url(#store-appstore-bg)" />
      {/* Simplified App Store “A” glyph */}
      <path
        fill="#fff"
        d="M12.05 5.2c.28 0 .5.1.66.38l5.55 9.9c.2.36.08.72-.28.9-.12.06-.24.08-.36.08-.22 0-.42-.1-.54-.32l-1.28-2.3H8.2l-1.28 2.3c-.12.22-.32.32-.54.32-.12 0-.24-.02-.36-.08-.36-.18-.48-.54-.28-.9l5.55-9.9c.16-.28.38-.38.66-.38Zm0 2.55L9.45 12.9h5.2L12.05 7.75Z"
      />
      <path
        fill="#fff"
        fillOpacity="0.92"
        d="M7.1 16.35h9.8c.42 0 .72.28.72.66 0 .38-.3.66-.72.66H7.1c-.42 0-.72-.28-.72-.66 0-.38.3-.66.72-.66Z"
      />
    </svg>
  );
}

/** Web app / PWA — install-to-home mark with brand gradient */
export function PwaIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <defs>
        <linearGradient id="store-pwa-bg" x1="3" y1="2" x2="21" y2="22">
          <stop stopColor="#818CF8" />
          <stop offset="0.55" stopColor="#6366F1" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="5.5" fill="url(#store-pwa-bg)" />
      {/* Device / home screen */}
      <rect
        x="6.25"
        y="4.5"
        width="11.5"
        height="15"
        rx="2.2"
        fill="none"
        stroke="#fff"
        strokeWidth="1.55"
      />
      <path
        d="M10 17.75h4"
        stroke="#fff"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      {/* Install / add-to-home arrow */}
      <path
        d="M12 8.1v5.1"
        stroke="#fff"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
      <path
        d="M9.55 11.35 12 13.85l2.45-2.5"
        fill="none"
        stroke="#fff"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
