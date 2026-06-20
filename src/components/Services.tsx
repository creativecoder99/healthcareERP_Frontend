"use client";

import React, { useEffect, useRef, useState } from "react";
import { HeartPulse, Stethoscope, Cpu, ArrowRight } from "lucide-react";
import styles from "./Services.module.css";

interface ServiceCard {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  link: string;
  colorClass: string;
}

export default function Services() {
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

  const services: ServiceCard[] = [
    {
      icon: <HeartPulse size={36} />,
      title: "Patient Portal",
      subtitle: "Your Health Command Centre",
      description: "Upload medical documents, track biomarker trends over time, chat with our AI health assistant, and share records with verified doctors — all in one place.",
      features: ["Medical Records Vault", "AI Health Chatbot", "Biomarker Trend Charts"],
      link: "#register-section",
      colorClass: styles.maternal,
    },
    {
      icon: <Stethoscope size={36} />,
      title: "Doctor Portal",
      subtitle: "AI-Powered Clinical Workflows",
      description: "View AI-generated patient summaries before every consult, manage appointment schedules, upload digital prescriptions, and conduct secure video consultations.",
      features: ["AI Patient Briefs", "Prescription Management", "Video Consultation Suite"],
      link: "#register-section",
      colorClass: styles.school,
    },
    {
      icon: <Cpu size={36} />,
      title: "AI Engine",
      subtitle: "Intelligence at the Core",
      description: "Our OCR and AI pipeline extracts structured data from any medical document, auto-tags report types, generates plain-English summaries, and powers the RAG chatbot.",
      features: ["OCR & Auto-Tagging", "Report Summarisation", "Contextual Health Chatbot"],
      link: "#register-section",
      colorClass: styles.clinic,
    },
  ];

  return (
    <section className={styles.servicesSection} id="services" ref={sectionRef}>
      {/* Grain texture overlay */}
      <div className="grain-overlay" />
      
      <div className={styles.bgGlow} />
      <div className="container">
        <div className={`${styles.header} reveal ${visible ? "visible" : ""}`}>
          <span className="badge-green">Our Platform</span>
          <h2 className={styles.title}>One Platform, Three Powerful Portals</h2>
          <p className={styles.subtitleText}>
            MediCore unifies patient record management, doctor workflows, and AI intelligence into one seamlessly integrated healthcare ecosystem.
          </p>
        </div>

        <div className={`${styles.grid} reveal-stagger ${visible ? "visible" : ""}`}>
          {services.map((service, index) => (
            <div key={index} className={`${styles.card} ${service.colorClass}`}>
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>{service.icon}</div>
                <div className={styles.cardHeaderTitles}>
                  <h3 className={styles.cardTitle}>{service.title}</h3>
                  <span className={styles.cardSubtitle}>{service.subtitle}</span>
                </div>
              </div>
              
              <p className={styles.cardDesc}>{service.description}</p>
              
              <ul className={styles.featureList}>
                {service.features.map((feature, fIdx) => (
                  <li key={fIdx} className={styles.featureItem}>
                    <span className={styles.bullet}>•</span> {feature}
                  </li>
                ))}
              </ul>
              
              <a href={service.link} className={styles.link}>
                Get Started <ArrowRight size={16} className={styles.linkArrow} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

