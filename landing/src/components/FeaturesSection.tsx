import { MAIN_FEATURES } from "@/lib/content";
import { FeatureIcon } from "./icons";
import { Reveal } from "./Reveal";

export function FeaturesSection() {
  return (
    <section className="features" id="features">
      <div className="site-container">
        <Reveal>
          <header className="section-head">
            <span className="section-head__eyebrow">امکانات اصلی</span>
            <h2 className="section-head__title">همه‌چیز برای سلامت روزانه‌ات</h2>
            <p className="section-head__lead">
              از ردیابی چرخه تا بارداری و مشاوره — ابزارهایی ساده و در دسترس
            </p>
          </header>
        </Reveal>

        <div className="features__bento">
          {MAIN_FEATURES.map((feature, index) => (
            <Reveal key={feature.id} delay={index * 0.04}>
              <article
                className={`feature-card ${index === 0 ? "feature-card--hero" : ""}`}
              >
                <div className="feature-card__icon">
                  <FeatureIcon name={feature.icon} className="feature-card__svg" />
                </div>
                <h3 className="feature-card__title">{feature.titleFa}</h3>
                <p className="feature-card__text">{feature.descriptionFa}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
