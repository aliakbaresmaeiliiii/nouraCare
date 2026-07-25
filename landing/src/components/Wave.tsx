type WaveProps = {
  from?: string;
  to?: string;
  flip?: boolean;
  className?: string;
};

/** Smooth organic wave used between tinted sections */
export function Wave({
  from = "var(--c-bg)",
  to = "var(--c-surface)",
  flip = false,
  className = "",
}: WaveProps) {
  return (
    <div
      className={`wave ${className}`}
      style={{ background: to, transform: flip ? "scaleY(-1)" : undefined }}
      aria-hidden
    >
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none" fill={from}>
        <path d="M0,64 C240,120 480,0 720,40 C960,80 1200,120 1440,48 L1440,0 L0,0 Z" />
      </svg>
    </div>
  );
}
