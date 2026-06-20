"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Play, ArrowDown } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./Hero.module.css";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const foreRef = useRef<HTMLDivElement>(null);

  const [timeLeft, setTimeLeft] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [waitlistCount, setWaitlistCount] = useState(4280);

  // 1. Live waitlist count up
  useEffect(() => {
    const interval = setInterval(() => {
      setWaitlistCount((prev: number) => prev + Math.floor(Math.random() * 2) + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // 2. Countdown logic targeting April 1, 2027 (Official Launch)
  useEffect(() => {
    const targetDate = new Date("2027-04-01T00:00:00").getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  // 3. GSAP Parallax ScrollTrigger + Entrance Animations
  useGSAP(
    () => {
      // Entrance reveal
      const entryTl = gsap.timeline();
      entryTl.fromTo(
        ".heroRevealText",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" }
      );
      entryTl.fromTo(
        ".heroRevealCard",
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.2)" },
        "-=0.4"
      );

      // Scroll-driven Parallax (only run on screen widths > 820px)
      const mm = gsap.matchMedia();
      mm.add("(min-width: 821px)", () => {
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        // Background translates down slowly
        scrollTl.fromTo(bgRef.current, { yPercent: -15 }, { yPercent: 10, ease: "none" }, 0);
        // Midground (School) translates UP (rises) to emerge from behind the hill as we scroll
        scrollTl.fromTo(midRef.current, { yPercent: 15 }, { yPercent: -15, ease: "none" }, 0);
        // Content translates up and fades out cleanly
        scrollTl.fromTo(contentRef.current, { yPercent: 0, opacity: 1 }, { yPercent: -35, opacity: 0, ease: "none" }, 0);
        // Foreground layer remains anchored at 0 as the stable front layer
        scrollTl.fromTo(foreRef.current, { yPercent: 0 }, { yPercent: 0, ease: "none" }, 0);
      });
    },
    { scope: heroRef }
  );

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className={styles.heroSection} id="hero" ref={heroRef}>
      {/* Parallax Layers */}
      <div className={styles.layerBg} ref={bgRef} />
      <div className={styles.layerMid} ref={midRef} />

      {/* Hero Content */}
      <div className={styles.heroContent} ref={contentRef}>
        <div className="container">
          <div className={styles.contentInner}>
            <span className="badge-green heroRevealText" style={{ backgroundColor: "var(--color-accent-gold)", color: "#000000" }}>
              AI-Augmented EHR Platform
            </span>
            <h1 className={styles.title + " heroRevealText"}>
              Your Complete Health Record, <span className={styles.titleHighlight}>One Secure Home</span>
            </h1>
            <p className={styles.sdgSubtitle + " heroRevealText"}>
              HIPAA-aligned · DPDPA Compliant · Privacy-First · AI-Powered
            </p>
            <p className={styles.desc + " heroRevealText"}>
              MediCore is India&apos;s cloud-native, AI-augmented Electronic Health Records platform. Centralise all your medical history — owned by you, AI-summarised for your doctors, and accessible anywhere on any device.
            </p>

            {/* CTAs */}
            <div className={styles.heroCtaGroup + " heroRevealText"}>
              <a
                href="/signup"
                className="btn-primary"
                style={{ backgroundColor: "var(--color-accent-gold)", color: "#000000" }}
              >
                Join Early Access <ArrowRight size={18} />
              </a>
              <a
                href="#how-it-works"
                className="btn-secondary"
                onClick={(e) => handleNavClick(e, "how-it-works")}
                style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", color: "#ffffff", borderColor: "rgba(255, 255, 255, 0.3)" }}
              >
                See How It Works <Play size={16} fill="currentColor" />
              </a>
            </div>

            {/* Combined Tickers Glass Card */}
            <div className={styles.statsCard + " heroRevealCard"}>
              {/* Counters */}
              <div className={styles.statCol}>
                <div className={styles.counterVal}>
                  {waitlistCount.toLocaleString()}
                </div>
                <div className={styles.counterText}>
                  <span className={styles.counterLabel}>Waitlist Members</span>
                  <span className={styles.counterDesc}>Growing — join before launch</span>
                </div>
              </div>

              <div className={styles.divider} />

              {/* Countdown Clock */}
              <div className={styles.countdownCol}>
                <h3 className={styles.countdownTitle}>Time to Official Launch</h3>
                <div className={styles.countdownGrid}>
                  <div className={styles.countdownCard}>
                    <span className={styles.countdownNum}>{timeLeft.days}</span>
                    <span className={styles.countdownLabel}>Days</span>
                  </div>
                  <div className={styles.countdownCard}>
                    <span className={styles.countdownNum}>{timeLeft.hours.toString().padStart(2, "0")}</span>
                    <span className={styles.countdownLabel}>Hrs</span>
                  </div>
                  <div className={styles.countdownCard}>
                    <span className={styles.countdownNum}>{timeLeft.minutes.toString().padStart(2, "0")}</span>
                    <span className={styles.countdownLabel}>Min</span>
                  </div>
                  <div className={styles.countdownCard}>
                    <span className={styles.countdownNum}>{timeLeft.seconds.toString().padStart(2, "0")}</span>
                    <span className={styles.countdownLabel}>Sec</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Featured Image */}
            <div className={styles.mobileFeaturedImage + " heroRevealCard"}>
              <img src="/images/parallax_foreground.png" alt="MediCore AI Health Records Platform" />
            </div>

            {/* Scroll Down Indicator */}
            <div className={styles.scrollDown + " heroRevealText"}>
              <a href="#about" onClick={(e) => handleNavClick(e, "about")} className={styles.scrollLink}>
                <span className={styles.scrollText}>scroll down</span>
                <ArrowDown size={16} className={styles.scrollArrow} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Foreground Layer */}
      <div className={styles.layerFore} ref={foreRef} />
    </section>
  );
}
