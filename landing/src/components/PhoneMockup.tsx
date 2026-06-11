"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import screenHome from "@/assets/images/screen-home.webp";
import screenPregnancy from "@/assets/images/screen-pregnancy.webp";

const SCREENSHOTS: { src: StaticImageData; alt: string }[] = [
  { src: screenHome, alt: "صفحه اصلی ردیابی چرخه در اپلیکیشن دوره" },
  { src: screenPregnancy, alt: "صفحه بارداری در اپلیکیشن دوره" },
];

const SLIDE_MS = 3000;

export function PhoneMockup() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % SCREENSHOTS.length);
    }, SLIDE_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="phone">
      <div className="phone__glow" aria-hidden />

      <div className="iphone17">
        <div className="iphone17__frame">
          <div className="iphone17__bezel">
            <div className="iphone17__screen">
              {SCREENSHOTS.map((shot, index) => (
                <div
                  key={shot.src.src}
                  className={`iphone17__slide ${index === activeIndex ? "is-active" : ""}`}
                  aria-hidden={index !== activeIndex}
                >
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    sizes="(max-width: 500px) 78vw, 280px"
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                    className="iphone17__shot"
                  />
                </div>
              ))}
              <div className="iphone17__island" aria-hidden>
                <span className="iphone17__island-lens" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="phone__dots" role="tablist" aria-label="نمایش اپ">
        {SCREENSHOTS.map((shot, index) => (
          <button
            key={shot.src.src}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={shot.alt}
            className={`phone__dot ${index === activeIndex ? "is-active" : ""}`}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
