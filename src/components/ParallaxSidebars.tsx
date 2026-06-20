"use client";

import React, { useEffect, useState } from "react";
import { Instagram, Twitter, Linkedin } from "lucide-react";
import styles from "./ParallaxSidebars.module.css";

const navSections = [
  { id: "hero", label: "Start", num: "01" },
  { id: "about", label: "About", num: "02" },
  { id: "work", label: "Our Work", num: "03" },
  { id: "services", label: "Services", num: "04" },
  { id: "journey", label: "Journey Map", num: "05" },
  { id: "how-it-works", label: "How It Works", num: "06" },
  { id: "register-section", label: "Register", num: "07" },
];

export default function ParallaxSidebars() {
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-45% 0px -45% 0px", // Trigger when the section dominates the center viewport
      threshold: 0,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    navSections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Left Social Links Sidebar */}
      <div className={styles.leftBar}>
        <span className={styles.socialText}>Follow Us</span>
        <div className={styles.line} />
        <a href="https://instagram.com" target="_blank" rel="noreferrer" className={styles.socialLink} aria-label="Instagram">
          <Instagram size={18} />
        </a>
        <a href="https://twitter.com" target="_blank" rel="noreferrer" className={styles.socialLink} aria-label="Twitter">
          <Twitter size={18} />
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noreferrer" className={styles.socialLink} aria-label="LinkedIn">
          <Linkedin size={18} />
        </a>
      </div>

      {/* Right Navigation Dots Sidebar */}
      <div className={styles.rightBar}>
        {navSections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => handleNavClick(e, section.id)}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
            >
              <span className={styles.label}>{section.label}</span>
              <span className={styles.num}>{section.num}</span>
              <div className={styles.dot} />
            </a>
          );
        })}
      </div>
    </>
  );
}
