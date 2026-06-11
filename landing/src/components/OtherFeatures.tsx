import { OTHER_FEATURES } from "@/lib/content";
import { Reveal } from "./Reveal";

export function OtherFeatures() {
  return (
    <section className="extras" id="more-features">
      <div className="site-container">
        <Reveal>
          <header className="section-head section-head--center">
            <span className="section-head__eyebrow">و خیلی چیزهای دیگر</span>
            <h2 className="section-head__title">امکانات بیشتر دوره</h2>
            <p className="section-head__lead">
              ابزارهایی که هر روز همراهت هستند — ساده، زیبا و در خدمت سلامتی تو
            </p>
          </header>
        </Reveal>

        <ul className="extras__list">
          {OTHER_FEATURES.map((item, index) => (
            <Reveal key={item.fa} delay={index * 0.03}>
              <li className="extras__item">
                <span className="extras__check" aria-hidden>
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>{item.fa}</span>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
