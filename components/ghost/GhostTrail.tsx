"use client";

import { useEffect, useRef } from "react";
import { GhostMark } from "./SiteHeader";

const ECHOES = 10; // trail copies behind the ghost
const LAG = 0.045; // seconds between each echo

/**
 * The hero ghost: swoops along a figure-of-eight and leaves a blurred, fading trail.
 * Every echo is the same ghost drawn slightly earlier on the path.
 */
export function GhostTrail({ width = 520, height = 90 }: { width?: number; height?: number }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();

    const pos = (t: number) => {
      const a = t * 1.9; // speed
      return {
        x: Math.sin(a) * (width / 2),
        y: Math.sin(a * 2) * (height / 2),
        tilt: Math.cos(a) * 14, // lean into the direction of travel
      };
    };

    const tick = (now: number) => {
      const t = (now - start) / 1000;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const p = pos(t - i * LAG);
        el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.tilt}deg)`;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [width, height]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 + height }} aria-hidden>
      {Array.from({ length: ECHOES + 1 }, (_, i) => ECHOES - i).map((i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="absolute will-change-transform"
          style={{
            opacity: i === 0 ? 1 : 0.45 * (1 - i / (ECHOES + 1)),
            filter: i === 0 ? "drop-shadow(0 0 28px rgba(191,243,229,0.55))" : `blur(${2 + i * 1.6}px)`,
            scale: i === 0 ? 1 : 1 - i * 0.025,
          }}
        >
          <GhostMark className="h-20 w-20" />
        </div>
      ))}
    </div>
  );
}
