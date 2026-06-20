"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./About.module.css";

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} id="about" ref={sectionRef}>
      {/* Grain texture overlay */}
      <div className="grain-overlay" />

      <div className="container">
        <div className={styles.grid}>
          {/* Left Column */}
          <div className={`${styles.leftCol} reveal ${visible ? "visible" : ""}`}>
            <span className={styles.subtitle}>Our Mission</span>
            <h2 className={styles.title}>Health Records That Work for You</h2>
            <p className={styles.desc}>
              MediCore is a cloud-native, AI-augmented Electronic Health Records platform that centralises a patient&apos;s
              entire medical history in one secure location. Patients own and control their data; healthcare providers
              gain structured, AI-summarised access through a privacy-first consent model.
            </p>
            <div className={styles.highlightText}>
              &ldquo;Bridging fragmented paper records, clinic silos, and disconnected apps into a single source of truth — accessible on any device, enriched by AI.&rdquo;
            </div>
            <p className={styles.desc}>
              We believe healthcare decisions should be powered by complete, accurate, and instantly accessible data.
              MediCore turns scattered PDFs and lab reports into a living, AI-enriched health profile — understood by
              both patients and their doctors.
            </p>
          </div>

          {/* Right Column: Feature Cards with stagger */}
          <div className={`${styles.rightCol} reveal-stagger ${visible ? "visible" : ""}`}>
            {/* Card 1 */}
            <div className={styles.sdgCard}>
              <div className={`${styles.sdgIcon} ${styles.sdg3Bg}`}>01</div>
              <h3 className={styles.sdgTitle}>Patient-First</h3>
              <p className={styles.sdgTitle} style={{ fontSize: "0.85rem", color: "var(--color-primary)", marginTop: "-6px" }}>
                Privacy &amp; Consent Control
              </p>
              <p className={styles.sdgDesc}>
                You own your health data. Grant or revoke doctor access at any time — with full audit trail visibility.
              </p>
            </div>

            {/* Card 2 */}
            <div className={styles.sdgCard}>
              <div className={`${styles.sdgIcon} ${styles.sdg4Bg}`}>AI</div>
              <h3 className={styles.sdgTitle}>AI-Powered</h3>
              <p className={styles.sdgTitle} style={{ fontSize: "0.85rem", color: "var(--color-primary)", marginTop: "-6px" }}>
                Intelligent Health Insights
              </p>
              <p className={styles.sdgDesc}>
                Our AI reads complex lab reports and imaging findings, translating medical jargon into clear, actionable summaries.
              </p>
            </div>

            {/* Card 3 */}
            <div className={styles.sdgCard}>
              <div className={`${styles.sdgIcon} ${styles.sdg13Bg}`}>∞</div>
              <h3 className={styles.sdgTitle}>Lifelong Records</h3>
              <p className={styles.sdgTitle} style={{ fontSize: "0.85rem", color: "var(--color-primary)", marginTop: "-6px" }}>
                From Birth to Senior Care
              </p>
              <p className={styles.sdgDesc}>
                One secure medical vault covering every stage of your health journey — always accessible, always yours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
