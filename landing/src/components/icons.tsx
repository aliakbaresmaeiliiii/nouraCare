type IconProps = { className?: string };

export function IconCalendar({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function IconPulse({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    </svg>
  );
}

export function IconBaby({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  );
}

export function IconStethoscope({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <circle cx="18" cy="18" r="3" />
      <path d="M18 15v-1a4 4 0 0 0-4-4h-1" />
    </svg>
  );
}

export function IconBook({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2V5z" />
      <path d="M6 3v16a2 2 0 0 1 2-2h12" />
    </svg>
  );
}

export function IconPeople({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M3 20c0-3.3 3.1-6 7-6M14 20c0-2.5 2-4.5 4.5-4.5" />
    </svg>
  );
}

const ICON_MAP = {
  calendar: IconCalendar,
  pulse: IconPulse,
  baby: IconBaby,
  stethoscope: IconStethoscope,
  book: IconBook,
  people: IconPeople,
} as const;

export function FeatureIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name as keyof typeof ICON_MAP] ?? IconCalendar;
  return <Icon className={className} />;
}
