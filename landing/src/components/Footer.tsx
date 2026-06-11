import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { DownloadButtons } from "./DownloadButtons";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="site-container footer__inner">
        <div className="footer__brand">
          <Image
            src={BRAND.logo}
            alt={BRAND.nameFa}
            width={48}
            height={48}
            className="footer__logo"
            loading="lazy"
          />
          <div>
            <p className="footer__name">{BRAND.nameFa}</p>
            <p className="footer__slogan">{BRAND.sloganFa}</p>
          </div>
        </div>

        <DownloadButtons size="sm" className="footer__downloads" />

        <nav className="footer__nav" aria-label="پاورقی">
          <a href="#features">ویژگی‌ها</a>
          <a href="#more-features">امکانات</a>
          <a href="#download">دانلود</a>
        </nav>

        <p className="footer__copy">
          © {year} {BRAND.nameEn}. تمامی حقوق محفوظ است.
        </p>
      </div>
    </footer>
  );
}
