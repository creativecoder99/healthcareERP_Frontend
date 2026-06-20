import React from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import ImpactBar from "@/components/ImpactBar";
import Highlights from "@/components/Highlights";
import Services from "@/components/Services";
import ScrollytellingJourney from "@/components/ScrollytellingJourney";
import HowItWorks from "@/components/HowItWorks";
import RegisterSection from "@/components/RegisterSection";
import Footer from "@/components/Footer";
import WaveDivider from "@/components/WaveDivider";
import ParallaxSidebars from "@/components/ParallaxSidebars";

/* Section bg colours to match wave fill ↔ next section */
const WHITE   = "#ffffff";
const CREAM   = "#fafbfa";
const FOREST  = "#143d22";

export default function Home() {
  return (
    <>
      <Header />
      <ParallaxSidebars />
      <main style={{ flex: "1 0 auto", marginTop: "0px", position: "relative" }}>

        {/* ── Hero ────────────────────────────────────────────── */}
        <Hero />
        {/* Wave: hero (cream) → About (white) */}
        <WaveDivider fill={WHITE} />

        {/* ── About ───────────────────────────────────────────── */}
        <About />
        {/* Wave: About (white) → ImpactBar (forest dark) */}
        <WaveDivider fill={FOREST} />

        {/* ── Impact Progress Bar ─────────────────────────────── */}
        <ImpactBar />
        {/* Wave: ImpactBar (forest) → Highlights (cream) */}
        <WaveDivider fill={CREAM} flip />

        {/* ── Highlights ──────────────────────────────────────── */}
        {/* Floating leaf decorator — left */}
        <div style={{ position: "relative", overflow: "hidden" }}>
          <svg
            aria-hidden="true"
            viewBox="0 0 120 120"
            style={{
              position: "absolute",
              left: "-30px",
              top: "60px",
              width: "160px",
              opacity: 0.06,
              color: "#225c34",
              fill: "currentColor",
              animation: "float 7s ease-in-out infinite",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <ellipse cx="60" cy="60" rx="50" ry="30" transform="rotate(-30 60 60)" />
          </svg>

          {/* Floating leaf decorator — right */}
          <svg
            aria-hidden="true"
            viewBox="0 0 120 120"
            style={{
              position: "absolute",
              right: "-20px",
              bottom: "40px",
              width: "120px",
              opacity: 0.05,
              color: "#c59b27",
              fill: "currentColor",
              animation: "float 9s ease-in-out infinite 2s",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <ellipse cx="60" cy="60" rx="50" ry="25" transform="rotate(20 60 60)" />
          </svg>

          <Highlights />
        </div>
        {/* Wave: Highlights (cream) → Services (white) */}
        <WaveDivider fill={WHITE} />

        {/* ── Services ────────────────────────────────────────── */}
        <Services />
        {/* Wave: Services (white) → Journey (dark forest) */}
        <WaveDivider fill="#0a1b10" />

        {/* ── Journey ─────────────────────────────────────────── */}
        <ScrollytellingJourney />
        {/* Wave: Journey (dark) → HowItWorks (white) */}
        <WaveDivider fill={WHITE} flip />

        {/* ── How It Works ────────────────────────────────────── */}
        {/* Floating leaf decorator */}
        <div style={{ position: "relative", overflow: "hidden" }}>
          <svg
            aria-hidden="true"
            viewBox="0 0 140 140"
            style={{
              position: "absolute",
              right: "5%",
              top: "30px",
              width: "200px",
              opacity: 0.04,
              color: "#3b7d4d",
              fill: "currentColor",
              animation: "float 8s ease-in-out infinite 1s",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <ellipse cx="70" cy="70" rx="60" ry="35" transform="rotate(15 70 70)" />
          </svg>
          <HowItWorks />
        </div>
        {/* Wave: HowItWorks (white) → Register (forest) */}
        <WaveDivider fill={FOREST} />

        {/* ── Register ────────────────────────────────────────── */}
        <RegisterSection />

      </main>
      <Footer />
    </>
  );
}
