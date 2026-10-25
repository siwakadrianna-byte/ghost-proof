"use client";

import { useEffect } from "react";

/** Fixed aurora background + film grain. Publishes scroll progress (0–1) as the CSS variable --scroll. */
export function Aurora() {
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--scroll", String(max > 0 ? window.scrollY / max : 0));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="aurora" aria-hidden>
        <div className="aurora__blob aurora__blob--plum" />
        <div className="aurora__blob aurora__blob--indigo" />
        <div className="aurora__blob aurora__blob--gold" />
        <div className="aurora__blob aurora__blob--mint" />
        <div className="aurora__vignette" />
      </div>
      <div className="grain" aria-hidden />
    </>
  );
}
