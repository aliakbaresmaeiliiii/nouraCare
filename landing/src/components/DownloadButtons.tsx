type DownloadButtonsProps = {
  size?: "sm" | "md";
  layout?: "inline" | "stack";
  className?: string;
};

export function DownloadButtons({
  size = "md",
  layout = "inline",
  className = "",
}: DownloadButtonsProps) {
  const btnClass = size === "sm" ? "dl-btn dl-btn--sm" : "dl-btn";
  const groupClass = `dl-group ${layout === "stack" ? "dl-group--stack" : ""} ${className}`.trim();

  return (
    <div className={groupClass}>
      <a href="#download" className={`${btnClass} dl-btn--primary`} aria-label="دانلود از کافه‌بازار">
        <CafeBazaarIcon />
        <span className="dl-btn__text">
          <span className="dl-btn__label">دانلود از</span>
          <span className="dl-btn__store">کافه‌بازار</span>
        </span>
      </a>
      <div className="dl-group__secondary">
        <a href="#download" className={btnClass} aria-label="دانلود از گوگل‌پلی">
          <GooglePlayIcon />
          <span className="dl-btn__text">
            <span className="dl-btn__label">دانلود از</span>
            <span className="dl-btn__store">گوگل‌پلی</span>
          </span>
        </a>
        <a href="#download" className={btnClass} aria-label="دانلود از اپ‌استور">
          <AppStoreIcon />
          <span className="dl-btn__text">
            <span className="dl-btn__label">دانلود از</span>
            <span className="dl-btn__store">اپ‌استور</span>
          </span>
        </a>
      </div>
    </div>
  );
}

function CafeBazaarIcon() {
  return (
    <svg className="dl-btn__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8l4-7v4h3l-4 7z" />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg className="dl-btn__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.6 2.4A1.2 1.2 0 0 0 2.4 3.6v16.8a1.2 1.2 0 0 0 1.8 1l10.2-6-10.2-6A1.2 1.2 0 0 0 3.6 2.4zm12.6 8.4-2.4-1.4 2.4-1.4 3.6 2.1a1.2 1.2 0 0 1 0 2.1l-3.6 2.1-2.4-1.4 2.4-1.4 1.2.7 2.4-1.4-2.4-1.4-1.2.7z" />
    </svg>
  );
}

function AppStoreIcon() {
  return (
    <svg className="dl-btn__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
