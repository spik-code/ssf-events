"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts from zero up to `to` the first time it scrolls into view. The server
 * renders the finished figure, so with JavaScript off, under reduced motion,
 * or if the observer never fires, the real number is simply there.
 */
export function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min((t - t0) / 1600, 1);
          setN(to * (1 - (1 - p) ** 3)); // ease-out
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  return (
    <span ref={ref}>
      {n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}
