"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import styles from "./ScrollytellingJourney.module.css";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface Milestone {
  ageTag: string;
  title: string;
  desc: string;
  action: string;
  imagePath: string;
  watermark: string;
}

const stageColors = [
  { bgStart: "#0a1b10", bgEnd: "#050d08" }, // Conception: Deep velvet forest green
  { bgStart: "#14331e", bgEnd: "#0b1c11" }, // Pregnancy: Deep Moss
  { bgStart: "#204b2f", bgEnd: "#122a1a" }, // Birth: Fresh Sage
  { bgStart: "#1b4d32", bgEnd: "#0f2e1e" }, // Infant: Mid Leaf
  { bgStart: "#1c5c3c", bgEnd: "#0e3422" }, // Toddler: Mint Forest
  { bgStart: "#385e38", bgEnd: "#203620" }, // School Age: Woodland
  { bgStart: "#6b5e28", bgEnd: "#3d3617" }, // Teen: Sunset Gold
  { bgStart: "#11381e", bgEnd: "#0a2212" }, // Adulthood: Rich Emerald
];

const particleData = [
  { left: "15%", top: "20%", delay: "0.2s", duration: "8s" },
  { left: "75%", top: "15%", delay: "1.5s", duration: "11s" },
  { left: "40%", top: "45%", delay: "0.8s", duration: "9s" },
  { left: "80%", top: "65%", delay: "2.3s", duration: "12s" },
  { left: "25%", top: "80%", delay: "3.1s", duration: "10s" },
  { left: "60%", top: "35%", delay: "0.5s", duration: "7s" },
  { left: "10%", top: "60%", delay: "1.8s", duration: "13s" },
  { left: "85%", top: "85%", delay: "2.7s", duration: "9s" },
  { left: "30%", top: "30%", delay: "1.1s", duration: "8s" },
  { left: "70%", top: "50%", delay: "2.0s", duration: "11s" },
];

function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = color1.startsWith("#") ? color1.slice(1) : color1;
  const c2 = color2.startsWith("#") ? color2.slice(1) : color2;

  const r1 = parseInt(c1.substring(0, 2), 16);
  const g1 = parseInt(c1.substring(2, 4), 16);
  const b1 = parseInt(c1.substring(4, 6), 16);

  const r2 = parseInt(c2.substring(0, 2), 16);
  const g2 = parseInt(c2.substring(2, 4), 16);
  const b2 = parseInt(c2.substring(4, 6), 16);

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  const toHex = (val: number) => val.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function ScrollytellingJourney() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const timelineColRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const cursorRef = useRef<SVGGElement>(null);
  const mobileLineRef = useRef<HTMLDivElement>(null);
  const lastStageRef = useRef<number>(-1); // guard: avoid redundant React re-renders
  const [activeStage, setActiveStage] = useState<number>(0);
  const [dotOffsets, setDotOffsets] = useState<number[]>([]);

  const updateDotOffsets = () => {
    if (typeof window === "undefined" || window.innerWidth < 1024) {
      setDotOffsets([]);
      return;
    }
    const timelineCol = timelineColRef.current;
    const path = pathRef.current;
    if (!timelineCol || !path) return;

    const nodes = timelineCol.querySelectorAll(".milestoneNode");
    const timelineColRect = timelineCol.getBoundingClientRect();
    const timelineHeight = timelineColRect.height;
    const pathLength = path.getTotalLength();

    const offsets: number[] = [];
    nodes.forEach((node) => {
      const htmlNode = node as HTMLElement;
      const dotWrapper = htmlNode.querySelector(`.${styles.dotWrapper}`) as HTMLElement;
      if (!dotWrapper) {
        offsets.push(0);
        return;
      }
      
      const nodeRect = htmlNode.getBoundingClientRect();
      const dotWrapperRect = dotWrapper.getBoundingClientRect();
      
      // Calculate dot Y relative to timelineCol using viewport coordinates
      const dotY = (dotWrapperRect.top + dotWrapperRect.height / 2) - timelineColRect.top;
      
      // Map dot Y to SVG path space (viewBox height is 1200)
      const targetY_svg = dotY * (1200 / timelineHeight);

      // Binary search the path to find the X at this target Y
      let start = 0;
      let end = pathLength;
      let bestX = 50;
      let minDiff = Infinity;

      for (let i = 0; i < 15; i++) {
        const mid = (start + end) / 2;
        const pt = path.getPointAtLength(mid);
        const diff = Math.abs(pt.y - targetY_svg);
        if (diff < minDiff) {
          minDiff = diff;
          bestX = pt.x;
        }
        if (pt.y < targetY_svg) {
          start = mid;
        } else {
          end = mid;
        }
      }

      // Calculate path X in pixels relative to right edge of timelineCol
      const targetRight_timelineCol = 50 - bestX;
      
      // Calculate right edge of milestoneNode relative to right edge of timelineCol
      const nodeShift = timelineColRect.right - nodeRect.right;
      
      // The wrapper's right style relative to milestoneNode
      const rightCss = targetRight_timelineCol - nodeShift;
      offsets.push(rightCss);
    });

    setDotOffsets(offsets);
  };

  React.useEffect(() => {
    // Run after a small timeout to let the font/layout settle
    const timer = setTimeout(() => {
      updateDotOffsets();
    }, 150);

    window.addEventListener("resize", updateDotOffsets);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateDotOffsets);
    };
  }, []);


  const milestones: Milestone[] = [
    {
      ageTag: "Stage 1 — Maternity Care",
      title: "Records from Day One",
      desc: "Centralise prenatal check-ups, ultrasound reports, and maternity records. Your health journey — and your child's — starts here.",
      action: "Upload Maternity Records",
      imagePath: "/images/conception.png",
      watermark: "01",
    },
    {
      ageTag: "Stage 2 — Pregnancy",
      title: "Track Every Milestone",
      desc: "Month-by-month pregnancy wellness records, fetal growth reports, and prenatal vaccine schedules — all organised automatically by our AI.",
      action: "Pregnancy Health Tracker",
      imagePath: "/images/pregnancy.png",
      watermark: "02",
    },
    {
      ageTag: "Stage 3 — Newborn Care",
      title: "Your Baby's Health Vault",
      desc: "Store birth records, neonatal reports, and early vaccination schedules. Build a complete health profile from the very first day.",
      action: "Add Newborn Records",
      imagePath: "/images/birth.png",
      watermark: "03",
    },
    {
      ageTag: "Stage 4 — Infant Years",
      title: "Growth & Development",
      desc: "Track immunisation schedules, developmental milestones, and paediatric check-ups. AI alerts ensure no vaccine is ever missed.",
      action: "Set Up Vaccine Reminders",
      imagePath: "/images/infant.png",
      watermark: "04",
    },
    {
      ageTag: "Stage 5 — Toddler Years",
      title: "Early Childhood Records",
      desc: "Log developmental screenings, nutrition check-ups, and early childhood wellness assessments — all with AI-powered summary insights.",
      action: "Track Child Development",
      imagePath: "/images/toddler.png",
      watermark: "05",
    },
    {
      ageTag: "Stage 6 — School Age",
      title: "School Health Management",
      desc: "Manage annual health screenings, eye tests, dental records, and school medical certificates — organised and accessible in one place.",
      action: "Manage School Health",
      imagePath: "/images/school.png",
      watermark: "06",
    },
    {
      ageTag: "Stage 7 — Teenage Years",
      title: "Adolescent Health Records",
      desc: "Track adolescent health screenings, mental wellness check-ins, and vaccine records privately and securely with full consent control.",
      action: "Set Up Teen Health Profile",
      imagePath: "/images/teenage.png",
      watermark: "07",
    },
    {
      ageTag: "Stage 8 — Adulthood & Beyond",
      title: "Lifelong Health Intelligence",
      desc: "Manage chronic conditions, specialist reports, and longitudinal health trends with AI-powered biomarker analytics across your entire history.",
      action: "View Health Analytics",
      imagePath: "/images/adulthood.png",
      watermark: "08",
    },
  ];

  // Image 3D tilt effects on mouse move inside the sticky showcase
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = x / rect.width - 0.5;
    const yPercent = y / rect.height - 0.5;

    const tiltX = yPercent * -10;
    const tiltY = xPercent * 10;

    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
  };

  useGSAP(
    () => {
      const section = sectionRef.current;
      const container = containerRef.current;
      const timelineCol = timelineColRef.current;
      const path = pathRef.current;
      const cursor = cursorRef.current;
      const mobileLine = mobileLineRef.current;

      if (!section || !container || !timelineCol) return;

      const mm = gsap.matchMedia();

      // Set initial background style
      gsap.set(section, {
        background: `linear-gradient(135deg, ${stageColors[0].bgStart}, ${stageColors[0].bgEnd})`,
      });

      // 1. Desktop Layout (min-width: 1024px): Pinned Split-Screen Scrollytelling
      mm.add("(min-width: 1024px)", () => {
        let pathLength = 0;
        if (path) {
          pathLength = path.getTotalLength();
          gsap.set(path, {
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength,
          });
        }

        const splitContainer = splitContainerRef.current;
        if (!splitContainer) return;

        // Master ScrollTrigger to pin the split container
        ScrollTrigger.create({
          trigger: splitContainer,
          start: "center center",
          end: "+=2200",
          pin: true,
          scrub: 1.2, // Smoother lag-free scrub (was 0.5 — too laggy)
          anticipatePin: 1, // Prevents pin-jump flash
          onUpdate: (self) => {
            const progress = self.progress;

            // Scroll timelineCol upward
            const parentHeight = timelineCol.parentElement?.clientHeight || 650;
            const scrollRange = timelineCol.scrollHeight - parentHeight;
            gsap.set(timelineCol, { y: -progress * scrollRange });

            // Draw SVG path
            if (path) {
              gsap.set(path, {
                strokeDashoffset: pathLength - progress * pathLength,
              });

              if (cursor) {
                const distance = progress * pathLength;
                const point = path.getPointAtLength(distance);
                const delta = 2;
                const nextDistance = Math.min(distance + delta, pathLength);
                const nextPoint = path.getPointAtLength(nextDistance);
                const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
                const scaleY = 1200 / timelineCol.scrollHeight;
                gsap.set(cursor, {
                  x: point.x,
                  y: point.y,
                  rotation: angle - 90,
                  scaleX: 1,
                  scaleY: scaleY,
                  transformOrigin: "50% 50%",
                });
              }
            }

            // Background gradient blend
            const numStages = stageColors.length;
            const rawIndex = progress * (numStages - 1);
            const i = Math.floor(rawIndex);
            const nextI = Math.min(i + 1, numStages - 1);
            const factor = rawIndex - i;

            const colorStart = interpolateColor(stageColors[i].bgStart, stageColors[nextI].bgStart, factor);
            const colorEnd = interpolateColor(stageColors[i].bgEnd, stageColors[nextI].bgEnd, factor);
            gsap.set(section, {
              background: `linear-gradient(135deg, ${colorStart}, ${colorEnd})`,
            });

            // Ken Burns — only update active + adjacent images (not all 8 every frame)
            const images = gsap.utils.toArray<HTMLElement>(".showcaseImage");
            images.forEach((img, idx) => {
              if (idx === i) {
                const isEven = idx % 2 === 0;
                const startScale = isEven ? 1.05 : 1.22;
                const endScale = isEven ? 1.22 : 1.05;
                gsap.set(img, {
                  scale: startScale + factor * (endScale - startScale),
                  xPercent: (isEven ? -4 : 4) + factor * (isEven ? 8 : -8),
                  yPercent: (isEven ? -6 : 6) + factor * (isEven ? 12 : -12),
                });
              } else if (idx === i - 1 || idx === i + 1) {
                // Reset only neighbours — skip the rest entirely
                gsap.set(img, { scale: 1.1, xPercent: 0, yPercent: 0 });
              }
            });

            // Only trigger React re-render when stage actually changes
            const newStage = Math.min(Math.floor(progress * 8), 7);
            if (newStage !== lastStageRef.current) {
              lastStageRef.current = newStage;
              setActiveStage(newStage);
            }
          },
        });

        // Background Parallax Leaves
        const parallaxLeaves = gsap.utils.toArray<HTMLElement>(".parallaxLeaf");
        parallaxLeaves.forEach((leaf) => {
          const speed = parseFloat(leaf.getAttribute("data-speed") || "0.2");
          gsap.to(leaf, {
            yPercent: speed * 150,
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          });
        });

        // Calculate and register offsets refresh
        updateDotOffsets();
        ScrollTrigger.addEventListener("refresh", updateDotOffsets);

        return () => {
          ScrollTrigger.removeEventListener("refresh", updateDotOffsets);
        };
      });

      // 2. Mobile Layout (max-width: 1023px): Simple scrolling reveals
      mm.add("(max-width: 1023px)", () => {
        if (mobileLine) {
          gsap.to(mobileLine, {
            height: "100%",
            ease: "none",
            scrollTrigger: {
              trigger: container,
              start: "top 25%",
              end: "bottom 75%",
              scrub: 0.5,
            },
          });
        }

        const nodes = gsap.utils.toArray<HTMLElement>(".milestoneNode");
        nodes.forEach((node, index) => {
          const dot = node.querySelector(".milestoneDot");

          ScrollTrigger.create({
            trigger: node,
            start: "top 70%",
            end: "bottom 30%",
            onEnter: () => {
              setActiveStage(index);
              gsap.to(section, {
                background: `linear-gradient(135deg, ${stageColors[index].bgStart}, ${stageColors[index].bgEnd})`,
                duration: 0.8,
                overwrite: "auto",
              });
            },
            onEnterBack: () => {
              setActiveStage(index);
              gsap.to(section, {
                background: `linear-gradient(135deg, ${stageColors[index].bgStart}, ${stageColors[index].bgEnd})`,
                duration: 0.8,
                overwrite: "auto",
              });
            },
          });

          gsap.fromTo(
            dot,
            { scale: 0.8 },
            {
              scale: 1,
              scrollTrigger: {
                trigger: node,
                start: "top 80%",
                end: "top 60%",
                scrub: true,
              },
            }
          );
        });
      });

      return () => {
        mm.revert();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section className={styles.section} id="journey" ref={sectionRef}>
      {/* Background Floating Parallax Leaves */}
      <svg
        className={`${styles.parallaxLeaf} parallaxLeaf`}
        data-speed="0.25"
        style={{ top: "15%", left: "5%", width: "60px", height: "60px", opacity: 0.08, position: "absolute", pointerEvents: "none" }}
        viewBox="0 0 100 100"
        fill="var(--color-primary)"
      >
        <path d="M 0 50 C 40 10, 60 10, 100 50 C 60 90, 40 90, 0 50 Z M 0 50 L 100 50" stroke="var(--color-primary-dark)" strokeWidth="3" />
      </svg>
      <svg
        className={`${styles.parallaxLeaf} parallaxLeaf`}
        data-speed="-0.35"
        style={{ top: "42%", right: "6%", width: "50px", height: "50px", opacity: 0.06, position: "absolute", pointerEvents: "none" }}
        viewBox="0 0 100 100"
        fill="var(--color-primary-medium)"
      >
        <path d="M 0 50 C 40 10, 60 10, 100 50 C 60 90, 40 90, 0 50 Z M 0 50 L 100 50" stroke="var(--color-primary-dark)" strokeWidth="3" />
      </svg>
      <svg
        className={`${styles.parallaxLeaf} parallaxLeaf`}
        data-speed="0.4"
        style={{ top: "68%", left: "4%", width: "55px", height: "55px", opacity: 0.07, position: "absolute", pointerEvents: "none" }}
        viewBox="0 0 100 100"
        fill="var(--color-accent-gold)"
      >
        <path d="M 0 50 C 40 10, 60 10, 100 50 C 60 90, 40 90, 0 50 Z M 0 50 L 100 50" stroke="var(--color-accent-gold)" strokeWidth="3" />
      </svg>
      <svg
        className={`${styles.parallaxLeaf} parallaxLeaf`}
        data-speed="-0.2"
        style={{ top: "88%", right: "8%", width: "65px", height: "65px", opacity: 0.05, position: "absolute", pointerEvents: "none" }}
        viewBox="0 0 100 100"
        fill="var(--color-primary-dark)"
      >
        <path d="M 0 50 C 40 10, 60 10, 100 50 C 60 90, 40 90, 0 50 Z M 0 50 L 100 50" stroke="#000" strokeWidth="3" />
      </svg>
 
      <div className="container" ref={containerRef}>
        <div className={styles.titleArea}>
          <span className={styles.subtitle}>Health Journey Timeline</span>
          <h2 className={styles.title}>MediCore — Your Lifelong Health Companion</h2>
        </div>
 
        {/* Split Screen Container */}
        <div className={styles.splitJourneyContainer} ref={splitContainerRef}>
          
          {/* Left Column: Scrolling Milestones with svg path */}
          <div className={styles.timelineCol} ref={timelineColRef}>
            {/* Desktop Winding SVG Path & Cursor */}
            <div className={styles.svgContainer}>
              <svg
                viewBox="0 0 100 1200"
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                fill="none"
                style={{ overflow: "visible" }}
              >
                {/* Background Path (gray) */}
                <path
                  className={styles.svgPathBg}
                  d="M 50 0 C 10 150, 10 100, 50 200 C 90 300, 90 250, 50 350 C 10 450, 10 400, 50 500 C 90 600, 90 550, 50 650 C 10 750, 10 700, 50 800 C 90 900, 90 850, 50 950 C 10 1050, 10 1000, 50 1100 L 50 1200"
                />
                {/* Active Path (colored - animated by GSAP) */}
                <path
                  ref={pathRef}
                  className={styles.svgPathActive}
                  d="M 50 0 C 10 150, 10 100, 50 200 C 90 300, 90 250, 50 350 C 10 450, 10 400, 50 500 C 90 600, 90 550, 50 650 C 10 750, 10 700, 50 800 C 90 900, 90 850, 50 950 C 10 1050, 10 1000, 50 1100 L 50 1200"
                />
                
                {/* Leaf Cursor Following Path */}
                <g ref={cursorRef} style={{ pointerEvents: "none" }}>
                  <path
                    d="M 0 0 C 10 -15, 20 -15, 30 0 C 20 15, 10 15, 0 0 Z"
                    fill="var(--color-primary)"
                    stroke="#ffffff"
                    strokeWidth="2"
                    transform="translate(-15, 0)"
                  />
                  <circle r="4" fill="var(--color-accent-gold)" />
                </g>
              </svg>
            </div>
 
            {/* Mobile straight lines */}
            <div className={styles.mobileLine} />
            <div className={styles.mobileLineActive} ref={mobileLineRef} />
 
            {/* Timeline Milestones (Scrolling list) */}
            {milestones.map((item, index) => {
              const isActive = activeStage === index;
              const isSprouted = activeStage >= index;
 
              return (
                <div key={index} className={`${styles.milestoneNode} milestoneNode`}>
                  {/* Scroll Dot & Sprout Leaf */}
                  <div
                    className={styles.dotWrapper}
                    style={
                      dotOffsets[index] !== undefined
                        ? {
                            right: `${dotOffsets[index]}px`,
                            left: "auto",
                            transform: "translate(50%, -50%)",
                          }
                        : {}
                    }
                  >
                    <div className={`${styles.dot} milestoneDot ${isActive ? styles.dotActive : ""}`} />
                    
                    {/* Sprout Leaf Icon */}
                    <svg
                      className={`${styles.sproutLeaf} milestoneSproutLeaf ${isSprouted ? styles.sproutLeafActive : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 20 2c-1 3.5-1.5 5.5-2.1 11.2A7 7 0 0 1 11 20z" />
                      <path d="M9 11l3 3" />
                    </svg>
                  </div>
 
                  {/* Cardless Clean Content Block */}
                  <div
                    className={`${styles.textCard} milestoneTextCard ${isActive ? styles.textCardActive : ""}`}
                    onClick={() => setActiveStage(index)}
                  >
                    {/* Giant Watermarked Number */}
                    <div className={styles.watermarkNumber}>{item.watermark}</div>

                    <span className={styles.ageTag}>{item.ageTag}</span>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardDesc}>{item.desc}</p>
                    
                    {/* Mobile Only Inline Image container */}
                    <div className={styles.mobileImageContainer}>
                      <Image
                        src={item.imagePath}
                        alt={item.title}
                        className={styles.mobileImage}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                    </div>
 
                    <span className={styles.actionBadge}>
                      {item.action} <ArrowRight size={12} style={{ marginLeft: "4px" }} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
 
          {/* Right Column: Pinned Showcase (Desktop only) */}
          <div className={styles.showcaseCol}>
            <div className={styles.stickyShowcase}>
              {milestones.map((item, index) => {
                const isActive = activeStage === index;
 
                return (
                  <div
                    key={index}
                    className={`${styles.showcaseCard} ${isActive ? styles.showcaseCardActive : ""}`}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <div className={styles.imageContainer}>
                      <Image
                        src={item.imagePath}
                        alt={item.title}
                        className={`${styles.milestoneImage} showcaseImage`}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        priority={index === 0}
                      />

                      {/* Dynamic Stage Particle Overlay */}
                      <div className={`${styles.particleOverlay} ${styles[`particlesStage${index + 1}`]}`}>
                        {particleData.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className={styles.particle}
                            style={{
                              left: p.left,
                              top: p.top,
                              animationDelay: p.delay,
                              animationDuration: p.duration,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Glassy Caption Overlay */}
                    <div className={styles.imageOverlay}>
                      <span className={styles.overlayTag}>{item.ageTag}</span>
                      <h3 className={styles.overlayTitle}>{item.title}</h3>
                      <p className={styles.overlayDesc}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
 
        </div>
      </div>
    </section>
  );
}
