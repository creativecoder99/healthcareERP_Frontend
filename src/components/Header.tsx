"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, Activity } from "lucide-react";
import styles from "./Header.module.css";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
        <div className={styles.container}>
          <a href="#" className={styles.logo} onClick={(e) => handleNavClick(e, "hero")}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#143d22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Activity size={20} color="#ffffff" strokeWidth={2.5} />
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.35rem", color: "#143d22", letterSpacing: "-0.5px" }}>MediCore</span>
            </div>
          </a>

          <nav className={styles.nav}>
            <a href="#about" className={styles.navLink} onClick={(e) => handleNavClick(e, "about")}>
              About
            </a>
            <a href="#work" className={styles.navLink} onClick={(e) => handleNavClick(e, "work")}>
              Features
            </a>
            <a href="#journey" className={styles.navLink} onClick={(e) => handleNavClick(e, "journey")}>
              Journey
            </a>
            <a href="#how-it-works" className={styles.navLink} onClick={(e) => handleNavClick(e, "how-it-works")}>
              How It Works
            </a>
            <a href="#contact" className={styles.navLink} onClick={(e) => handleNavClick(e, "contact")}>
              Contact
            </a>
          </nav>

          <div className={styles.actions}>
            <Link
              href="/login"
              style={{ marginRight: "16px", color: "var(--color-primary-dark)", fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}
            >
              Sign In
            </Link>
            <div className={styles.cta}>
              <Link
                href="/signup"
                className="btn-primary"
                style={{ padding: "10px 20px", fontSize: "0.9rem" }}
              >
                Get Early Access <ArrowRight size={16} />
              </Link>
            </div>

            <button
              className={styles.menuButton}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""} ${
          isScrolled ? styles.scrolledOffset : ""
        }`}
      >
        <a href="#about" className={styles.mobileLink} onClick={(e) => handleNavClick(e, "about")}>
          About
        </a>
        <a href="#work" className={styles.mobileLink} onClick={(e) => handleNavClick(e, "work")}>
          Features
        </a>
        <a href="#journey" className={styles.mobileLink} onClick={(e) => handleNavClick(e, "journey")}>
          Journey
        </a>
        <a href="#how-it-works" className={styles.mobileLink} onClick={(e) => handleNavClick(e, "how-it-works")}>
          How It Works
        </a>
        <a href="#contact" className={styles.mobileLink} onClick={(e) => handleNavClick(e, "contact")}>
          Contact
        </a>
        <div className={styles.mobileCta}>
          <Link
            href="/signup"
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Get Early Access <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </>
  );
}
