"use client";

import React from "react";
import { Mail, Globe, Activity } from "lucide-react";
import styles from "./Footer.module.css";

export default function Footer() {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className={styles.footer} id="contact">
      <div className="container">
        <div className={styles.grid}>
          {/* Brand Column */}
          <div className={styles.brandCol}>
            <a href="#" className={styles.logo} onClick={(e) => handleNavClick(e, "hero")}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#143d22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Activity size={20} color="#ffffff" strokeWidth={2.5} />
                </div>
                <span style={{ fontWeight: 800, fontSize: "1.35rem", color: "#ffffff", letterSpacing: "-0.5px" }}>MediCore</span>
              </div>
            </a>
            <p className={styles.desc}>
              India&apos;s cloud-native, AI-augmented Electronic Health Records platform. Centralise your medical history,
              get AI-powered insights, and connect with verified healthcare providers — all in one privacy-first platform.
            </p>
            <div className={styles.sdgBadges}>
              <span className={`${styles.sdgBadge} ${styles.sdg3}`}>HIPAA-Aligned</span>
              <span className={`${styles.sdgBadge} ${styles.sdg4}`}>DPDPA Compliant</span>
              <span className={`${styles.sdgBadge} ${styles.sdg13}`}>Privacy-First</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={styles.colTitle}>Navigation</h4>
            <ul className={styles.linkList}>
              <li>
                <a href="#" className={styles.link} onClick={(e) => handleNavClick(e, "hero")}>
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className={styles.link} onClick={(e) => handleNavClick(e, "about")}>
                  About
                </a>
              </li>
              <li>
                <a href="#work" className={styles.link} onClick={(e) => handleNavClick(e, "work")}>
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className={styles.link} onClick={(e) => handleNavClick(e, "how-it-works")}>
                  How It Works
                </a>
              </li>
              <li>
                <a href="#blog" className={styles.link}>
                  Blog
                </a>
              </li>
              <li>
                <a href="#register-section" className={styles.link} onClick={(e) => handleNavClick(e, "register-section")}>
                  Get Early Access
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / Info */}
          <div>
            <h4 className={styles.colTitle}>Resources</h4>
            <ul className={styles.linkList}>
              <li>
                <a href="#faq" className={styles.link}>
                  FAQ
                </a>
              </li>
              <li>
                <a href="#privacy" className={styles.link}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className={styles.link}>
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#docs" className={styles.link}>
                  API Docs
                </a>
              </li>
              <li>
                <a href="#security" className={styles.link} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  Security &amp; Compliance
                </a>
              </li>
              <li>
                <a href="#careers" className={styles.link} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Globe size={16} /> Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className={styles.colTitle}>Contact Us</h4>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <a href="mailto:anuragmohanty9999@gmail.com">
                  <Mail size={18} className={styles.contactIcon} />
                  <span className={styles.contactText}>anuragmohanty9999@gmail.com</span>
                </a>
              </li>
              <li className={styles.contactItem}>
                <a href="https://medicore.health" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Globe size={18} className={styles.contactIcon} />
                  <span className={styles.contactText}>medicore.health</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & badges */}
        <div className={styles.bottom}>
          <div className={styles.copyText}>
            © {new Date().getFullYear()} MediCore. All rights reserved.
          </div>
          <div className={styles.badges}>
            <span className={styles.badge}>HIPAA-Aligned</span>
            <span className={styles.badge}>DPDPA Compliant</span>
            <span className={`${styles.badge} ${styles.badgeHighlight}`}>AI-Powered EHR Platform</span>
            <span className={styles.badge}>Privacy-First</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
