import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function GooglePlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path fill="#00C3FF" d="M3 3.2v17.6L12.2 12 3 3.2Z" />
      <path fill="#FFD400" d="M3 3.2 12.2 12l5.1-2.9L19.8 7.5 3 3.2Z" />
      <path fill="#FF3A44" d="M3 20.8 12.2 12l5.1 2.9 2.5 1.6L3 20.8Z" />
      <path fill="#00F076" d="M12.2 12 17.3 9.1l2.5-1.6v9l-2.5-1.6L12.2 12Z" />
    </svg>
  );
}

/** Cafe Bazaar brand mark — green tile with white “B” monogram */
export function CafeBazaarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <rect width="24" height="24" rx="5" fill="#0AAD5A" />
      <path
        fill="#fff"
        d="M7.15 6.25h4.2c2.45 0 4.05 1.4 4.05 3.5 0 1.35-.65 2.4-1.8 2.95l2.35 4.85h-2.45l-2.1-4.5H9.4v4.5H7.15V6.25Zm2.25 1.9v3.1h1.85c1.15 0 1.85-.55 1.85-1.55s-.7-1.55-1.85-1.55H9.4Z"
      />
    </svg>
  );
}

export function AppStoreIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M16.37 12.74c.03 3.38 2.97 4.51 3 4.52-.03.08-.47 1.6-1.55 3.17-1.07 1.57-2.18 3.13-3.93 3.16-1.72.03-2.28-1.02-4.25-1.02-1.98 0-2.6 1-4.25 1.05-1.7.05-3-1.68-4.08-3.24C-.3 17.56-1.56 12.7.73 9.42c1.14-1.63 2.98-2.66 5.05-2.69 1.58-.03 3.07 1.06 4.05 1.06.98 0 2.81-1.31 4.74-1.12.81.03 3.08.33 4.54 2.46-.12.07-2.71 1.58-2.74 4.61ZM13.9 4.84c.85-1.03 1.43-2.46 1.27-3.89-1.23.05-2.72.82-3.6 1.85-.79.91-1.48 2.37-1.29 3.77 1.36.1 2.76-.7 3.62-1.73Z" />
    </svg>
  );
}

export function PwaIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
      {...props}
    >
      <rect x="3.5" y="4.5" width="17" height="12" rx="2" />
      <path d="M8 20.5h8M12 16.5v4" strokeLinecap="round" />
      <path
        d="M9.2 9.2 12 12l2.8-2.8M12 12V7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
