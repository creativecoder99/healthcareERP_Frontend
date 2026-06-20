"use client";

import React, { useEffect, useRef, useState } from "react";
import { FileText, Sparkles, Video, ShieldCheck, TrendingUp, Bell } from "lucide-react";
import styles from "./Highlights.module.css";

interface HighlightItem {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export default function Highlights() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const highlights: HighlightItem[] = [
    {
      icon: <FileText size={28} />,
      title: "Medical Records Vault",
      desc: "Upload and organise every report, prescription, and discharge summary in one secure, searchable place — with AI auto-tagging.",
    },
    {
      icon: <Sparkles size={28} />,
      title: "AI Health Summaries",
      desc: "Our AI reads complex lab reports and imaging findings, translating medical jargon into clear, actionable plain-English insights.",
    },
    {
      icon: <Video size={28} />,
      title: "Video Consultations",
      desc: "Connect face-to-face with verified doctors from home. Share your records directly during the call for richer, faster consultations.",
    },
    {
      icon: <ShieldCheck size={28} />,
      title: "Privacy & Consent First",
      desc: "You control exactly who sees your data, for how long, and which records they can access — with a full audit trail.",
    },
    {
      icon: <TrendingUp size={28} />,
      title: "Health Analytics",
      desc: "Track biomarkers like HbA1c, TSH, and cholesterol over time with interactive trend charts and reference-range overlays.",
    },
    {
      icon: <Bell size={28} />,
      title: "Smart Notifications",
      desc: "Never miss an appointment or follow-up. Get timely alerts for upcoming consultations, record activity, and doctor access requests.",
    },
  ];

  return (
    <section className={styles.section} id="work" ref={sectionRef}>
      <div className="container">
        <div className={`${styles.titleArea} reveal ${visible ? "visible" : ""}`}>
          <span className={styles.subtitle}>Key Features</span>
          <h2 className={styles.title}>Built for Modern Healthcare</h2>
          <p className={styles.intro}>
            MediCore brings together medical record management, AI-powered insights, and seamless doctor collaboration into one privacy-first platform.
          </p>
        </div>

        <div className={`${styles.grid} reveal-stagger ${visible ? "visible" : ""}`}>
          {highlights.map((item, index) => (
            <div key={index} className="card">
              <div className={styles.iconWrapper}>{item.icon}</div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
