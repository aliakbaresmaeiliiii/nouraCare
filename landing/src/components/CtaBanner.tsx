import { BRAND } from "@/lib/brand";
import { DownloadButtons } from "./DownloadButtons";
import { Reveal } from "./Reveal";

export function CtaBanner() {
  return (
    <section className="cta">
      <div className="site-container">
        <Reveal>
          <div className="cta__card">
            <p className="cta__eyebrow">همین الان شروع کن</p>
            <h2 className="cta__title">{BRAND.nameFa}، همراه سلامتی تو</h2>
            <p className="cta__text">
              دانلود رایگان — بدون نیاز به کارت بانکی. داده‌هایت فقط روی گوشی خودت می‌ماند.
            </p>
            <DownloadButtons className="cta__downloads" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
