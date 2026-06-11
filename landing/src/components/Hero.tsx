import { BRAND } from "@/lib/brand";
import { DownloadButtons } from "./DownloadButtons";
import { PhoneMockup } from "./PhoneMockup";

const TRUST_STATS = [
  { value: "۱۰۰٪", label: "خصوصی" },
  { value: "رایگان", label: "شروع" },
  { value: "۲۴/۷", label: "یادآور" },
];

const HERO_DESC_MOBILE =
  "چرخه، علائم و بارداری را با یادآورهای ملایم و حریم خصوصی روی گوشی خودت دنبال کن.";

export function Hero() {
  return (
    <section className="hero" id="download">
      <div className="hero__bg" aria-hidden />

      <div className="site-container hero__grid">
        <div className="hero__copy">
          <span className="hero__badge">
            <span className="hero__badge-dot" aria-hidden />
            اپلیکیشن سلامت زنان
          </span>

          <h1 className="hero__title">
            <span className="hero__title-brand">{BRAND.nameFa}</span>
            <span className="hero__title-sub">{BRAND.sloganFa}</span>
          </h1>

          <p className="hero__desc hero__desc--desktop">{BRAND.descriptionFa}</p>
          <p className="hero__desc hero__desc--mobile">{HERO_DESC_MOBILE}</p>

          <DownloadButtons className="hero__downloads" />

          <ul className="hero__stats">
            {TRUST_STATS.map((stat) => (
              <li key={stat.label} className="hero__stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="hero__visual">
          <PhoneMockup />
        </div>
      </div>

      <a href="#features" className="hero__scroll" aria-label="رفتن به ویژگی‌ها">
        <span className="hero__scroll-icon" aria-hidden />
        <span>بیشتر بدانید</span>
      </a>
    </section>
  );
}
