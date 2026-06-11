"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";

const NAV_LINKS = [
  { href: "#features", label: "ویژگی‌ها" },
  { href: "#more-features", label: "امکانات بیشتر" },
  { href: "#download", label: "دانلود" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      document.documentElement.classList.toggle("is-scrolled", window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="site-header">
        <div className="site-container site-header__inner">
          <a href="#" className="site-header__brand" onClick={closeMenu}>
            <Image
              src={BRAND.logo}
              alt={BRAND.nameFa}
              width={36}
              height={36}
              className="site-header__logo"
              priority
            />
            <span className="site-header__name">{BRAND.nameFa}</span>
          </a>

          <nav className="site-header__nav" aria-label="اصلی">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="nav-link">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="site-header__actions">
            <a href="#download" className="header-cta header-cta--desktop">
              دانلود رایگان
            </a>
            <a href="#download" className="header-cta header-cta--mobile">
              دانلود
            </a>
            <button
              type="button"
              className={`menu-toggle ${menuOpen ? "is-open" : ""}`}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="menu-toggle__bar" />
              <span className="menu-toggle__bar" />
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <button type="button" className="mobile-menu__backdrop" onClick={closeMenu} aria-label="بستن منو" />
        <nav className="mobile-menu__panel" aria-label="منوی موبایل">
          <div className="mobile-menu__head">
            <span className="mobile-menu__title">منو</span>
            <button
              type="button"
              className="mobile-menu__close"
              onClick={closeMenu}
              aria-label="بستن منو"
            >
              ✕
            </button>
          </div>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="mobile-menu__link" onClick={closeMenu}>
              {link.label}
            </a>
          ))}
          <a href="#download" className="mobile-menu__cta" onClick={closeMenu}>
            دانلود رایگان
          </a>
        </nav>
      </div>
    </>
  );
}
