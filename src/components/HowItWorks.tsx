"use client";

import React, { useEffect, useRef, useState } from "react";
import { UserPlus, Upload, Video, Check } from "lucide-react";
import styles from "./HowItWorks.module.css";

interface StepItem {
  number: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  features: string[];
}

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const steps: StepItem[] = [
    {
      number: "01",
      icon: <UserPlus size={24} />,
      title: "Create Your Account",
      desc: "Sign up in seconds with your email or phone number. Complete your health profile and you're ready to start building your medical vault.",
      features: [
        "OTP-verified registration",
        "HIPAA & DPDPA compliant from day one",
        "Free plan — no credit card needed",
      ],
    },
    {
      number: "02",
      icon: <Upload size={24} />,
      title: "Upload & Organise Records",
      desc: "Upload any medical document — PDF, JPG, or PNG. Our AI auto-tags reports, extracts key data, and generates plain-English summaries instantly.",
      features: [
        "AI auto-tagging & report classification",
        "Plain-English summaries with abnormal value alerts",
        "Searchable by keyword, date, or report type",
      ],
    },
    {
      number: "03",
      icon: <Video size={24} />,
      title: "Connect & Consult",
      desc: "Invite your doctors to MediCore or request access to verified providers. Share records securely and book one-click video consultations.",
      features: [
        "Invite doctors via email or QR code",
        "Time-limited or permanent record sharing",
        "One-click WebRTC video consultations",
      ],
    },
  ];

  return (
    <section className={styles.section} id="how-it-works" ref={sectionRef}>
      {/* Grain texture overlay */}
      <div className="grain-overlay" />

      <div className="container">
        <div className={`${styles.titleArea} reveal ${visible ? "visible" : ""}`}>
          <span className={styles.subtitle}>Process</span>
          <h2 className={styles.title}>Get Started in 3 Simple Steps</h2>
        </div>

        <div className={`${styles.stepsGrid} reveal-stagger ${visible ? "visible" : ""}`}>
          {steps.map((step, index) => (
            <div key={index} className={styles.stepCard}>
              <div className={styles.stepNumber}>{step.number}</div>
              <div className={styles.iconWrapper}>{step.icon}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
              
              <ul className={styles.featureList}>
                {step.features.map((feat, fIndex) => (
                  <li key={fIndex} className={styles.featureItem}>
                    <Check size={16} className={styles.checkIcon} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

