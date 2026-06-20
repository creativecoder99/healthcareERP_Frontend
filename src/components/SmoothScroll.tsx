"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger if it's not already
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // If it's a dashboard page, login, or signup, do not initialize Lenis
    const isAppPage = pathname.startsWith("/patient") || pathname === "/login" || pathname === "/signup";
    if (isAppPage) return;

    // 1. Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth easeOutQuad
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    // 2. Connect Lenis to ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // 3. Connect GSAP ticker to Lenis requestAnimationFrame
    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    // 4. Cleanup on unmount
    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}
