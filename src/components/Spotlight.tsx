"use client";

import { useEffect, useRef } from "react";

export default function Spotlight() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    const ease = 0.12;

    const setPos = (x: number, y: number) => {
      targetX = x;
      targetY = y;
      el.style.opacity = "1";
    };

    const animate = () => {
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;
      el.style.setProperty("--x", `${currentX}px`);
      el.style.setProperty("--y", `${currentY}px`);
      raf = window.requestAnimationFrame(animate);
    };

    const handleMouse = (e: MouseEvent) => setPos(e.clientX, e.clientY);
    const handleTouch = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        setPos(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleLeave = () => {
      if (!el) return;
      el.style.opacity = "0";
    };

    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("touchmove", handleTouch, { passive: true });
    window.addEventListener("mouseout", handleLeave);
    window.addEventListener("touchend", handleLeave);
    raf = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("touchmove", handleTouch as EventListener);
      window.removeEventListener("mouseout", handleLeave);
      window.removeEventListener("touchend", handleLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-300"
      style={{
        opacity: 0,
        background:
          "radial-gradient(circle 320px at var(--x,50%) var(--y,50%), rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.1) 38%, rgba(255,255,255,0) 72%)",
        mixBlendMode: "screen",
      }}
    />
  );
}
