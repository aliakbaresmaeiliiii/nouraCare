"use client";

import { useEffect, useState } from "react";

export function MobileDownloadBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 320);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`mobile-dl-bar ${visible ? "is-visible" : ""}`} aria-hidden={!visible}>
      <a href="#download" className="mobile-dl-bar__btn">
        دانلود رایگان دوره
      </a>
    </div>
  );
}
