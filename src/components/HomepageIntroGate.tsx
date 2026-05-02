"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
};

const STORAGE_KEY = "devmatch-homepage-intro-seen";

export default function HomepageIntroGate({ children }: Props) {
  const [mounted, setMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [introGone, setIntroGone] = useState(false);
  const wheelAccum = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const revealTimer = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;

    async function bootstrap() {
      const seenIntro = window.localStorage.getItem(STORAGE_KEY) === "1";
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!alive) return;

      if (user || seenIntro) {
        setContentVisible(true);
        setIntroGone(true);
        setShowIntro(false);
        return;
      }

      setShowIntro(true);
      setContentVisible(false);
      setIntroGone(false);
    }

    setMounted(true);
    void bootstrap();

    return () => {
      alive = false;
      if (revealTimer.current) {
        window.clearTimeout(revealTimer.current);
      }
    };
  }, []);

  const revealHomepage = () => {
    if (!showIntro) return;

    window.localStorage.setItem(STORAGE_KEY, "1");
    setContentVisible(true);
    setShowIntro(false);

    if (revealTimer.current) {
      window.clearTimeout(revealTimer.current);
    }

    revealTimer.current = window.setTimeout(() => {
      setIntroGone(true);
    }, 1220);
  };

  const introVisible = mounted && showIntro && !introGone;

  return (
    <div className="relative">
      <div
        className={`transition-[opacity,filter,transform] duration-[1200ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
          contentVisible
            ? "opacity-100 blur-0 translate-y-0"
            : "opacity-0 blur-[12px] translate-y-3"
        }`}
      >
        {children}
      </div>

      {introVisible ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.14),transparent_42%),linear-gradient(180deg,#0c0c0f_0%,#09090b_100%)] touch-none"
          onWheel={(event) => {
            if (event.deltaY >= 0) return;
            event.preventDefault();
            wheelAccum.current += -event.deltaY;

            if (wheelAccum.current > 120) {
              revealHomepage();
            }
          }}
          onTouchStart={(event) => {
            touchStartY.current = event.touches[0]?.clientY ?? null;
          }}
          onTouchMove={(event) => {
            const startY = touchStartY.current;
            const currentY = event.touches[0]?.clientY;

            if (startY === null || currentY === undefined) return;

            const delta = startY - currentY;
            if (delta > 14) {
              event.preventDefault();
            }

            if (delta > 100) {
              revealHomepage();
            }
          }}
          onTouchEnd={() => {
            touchStartY.current = null;
            wheelAccum.current = 0;
          }}
        >
          <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_center,rgba(255,255,255,0.04),transparent_60%)]" />

          <div className="relative flex flex-col items-center justify-center">
            <div className="intro-swipe-wrap animate-[introSwipeUp_1.9s_cubic-bezier(0.22,0.61,0.36,1)_infinite]">
              <svg
                viewBox="0 0 256 256"
                preserveAspectRatio="xMidYMid meet"
                className="h-56 w-56 block text-white"
                shapeRendering="geometricPrecision"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  stroke="none"
                  d="M188,84a27.82842,27.82842,0,0,0-14.6416,4.145A27.97776,27.97776,0,0,0,136,74.707V36a28,28,0,0,0-56,0v91.41016l-6.999-12.12354a28.00028,28.00028,0,0,0-48.6709,27.69629C56.77832,211.39941,78.39355,240,128,240a88.09957,88.09957,0,0,0,88-88V112A28.03146,28.03146,0,0,0,188,84Zm12,68a72.08124,72.08124,0,0,1-72,72c-20.17871,0-34.22656-5.45459-46.97461-18.23828-12.499-12.53369-24.77246-32.78565-42.36426-69.90137q-.13916-.293-.30175-.57422a12.00011,12.00011,0,0,1,20.78515-11.99951l21.92774,37.97949a7.9997,7.9997,0,0,0,14.92773-4V36a12,12,0,0,1,24,0v68a8,8,0,0,0,16,0v-4a12,12,0,0,1,24,0v12a8,8,0,0,0,16,0,12,12,0,0,1,24,0Z"
                />
              </svg>

              <div className="mt-8 h-20 w-1 rounded-full bg-gradient-to-b from-transparent via-white/45 to-transparent opacity-75" />
            </div>
          </div>

          <style jsx>{`
            @keyframes introSwipeUp {
              0% {
                transform: translateY(64px) scale(0.98);
                opacity: 0;
              }
              12% {
                opacity: 1;
              }
              48% {
                transform: translateY(-2px) scale(1);
                opacity: 1;
              }
              82% {
                opacity: 1;
              }
              100% {
                transform: translateY(-84px) scale(0.98);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      ) : null}
    </div>
  );
}
