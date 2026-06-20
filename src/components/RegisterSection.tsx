"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, CheckCircle, X, Download } from "lucide-react";
import confetti from "canvas-confetti";
import styles from "./RegisterSection.module.css";

export default function RegisterSection() {
  const [formData, setFormData] = useState({ fullName: "", email: "", role: "patient" });
  const [showModal, setShowModal] = useState(false);
  const [regNumber, setRegNumber] = useState("");
  const [waitlistCount, setWaitlistCount] = useState(4280);

  // Live waitlist count up effect
  useEffect(() => {
    const interval = setInterval(() => {
      setWaitlistCount((prev: number) => prev + Math.floor(Math.random() * 2) + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) return;

    // Create a mock registration number
    const rand = Math.floor(100000 + Math.random() * 900000);
    setRegNumber(`MEDICORE-${rand}`);

    // Trigger confetti
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#225c34", "#3b7d4d", "#8cb899", "#c59b27", "#ffffff"],
    });

    setShowModal(true);
    setWaitlistCount((prev) => prev + 1);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ fullName: "", email: "", role: "patient" });
  };

  return (
    <section className={styles.section} id="register-section">
      <div className={styles.bgDecoration} />
      <div className="container">
        <div className={styles.grid}>
          {/* Left Column: Stats & Mission */}
          <div className={styles.infoCol}>
            <span className={styles.subtitle}>Early Access</span>
            <h2 className={styles.title}>Join the MediCore Waitlist</h2>
            <p className={styles.desc}>
              Be among the first to experience India&apos;s most advanced AI-powered Electronic Health Records platform.
              Get early access, exclusive launch pricing, and help shape the product before it goes live.
            </p>

            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <div className={styles.statVal}>{waitlistCount.toLocaleString()}+</div>
                <div className={styles.statLabel}>Waitlist Members</div>
                <div className={styles.statDesc}>Patients &amp; doctors signed up</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statVal}>500+</div>
                <div className={styles.statLabel}>Verified Doctors</div>
                <div className={styles.statDesc}>Ready to onboard at launch</div>
              </div>
            </div>

            <p className={styles.desc} style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
              MediCore is built HIPAA-aligned and DPDPA-compliant from the ground up. Your health data stays yours —
              always encrypted, always under your control.
            </p>
          </div>

          {/* Right Column: Registration Card */}
          <div>
            <div className={styles.regCard}>
              <form onSubmit={handleRegister}>
                <div className={styles.formGroup}>
                  <label htmlFor="regFullName" className={styles.formLabel}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="regFullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="regEmail" className={styles.formLabel}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="regEmail"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="regRole" className={styles.formLabel}>
                    I am a&hellip;
                  </label>
                  <select
                    id="regRole"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={styles.formSelect}
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor / Specialist</option>
                    <option value="clinic">Clinic / Hospital</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "12px" }}>
                  Join Early Access <ArrowRight size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <div className={`${styles.modalOverlay} ${showModal ? styles.modalOverlayOpen : ""}`}>
        <div className={styles.modalContent}>
          <button className={styles.modalClose} onClick={closeModal} aria-label="Close">
            <X size={24} />
          </button>
          
          <CheckCircle size={54} strokeWidth={2} className={styles.successIcon} />
          
          <h2>You&apos;re on the List!</h2>
          <p style={{ marginTop: "8px", fontSize: "0.95rem" }}>
            We&apos;ll notify <strong>{formData.email}</strong> as soon as MediCore early access opens.
            Thank you for being part of the journey!
          </p>

          <div className={styles.certBox}>
            <div className={styles.certTitle}>Early Access Confirmation</div>
            <p className={styles.certText}>This confirms that</p>
            <div className={styles.certName}>{formData.fullName}</div>
            <p className={styles.certText} style={{ marginBottom: "0", fontSize: "0.85rem" }}>
              is registered for early access to <strong>MediCore</strong> — India&apos;s AI-augmented Electronic
              Health Records platform. You&apos;ll be notified at launch with exclusive pricing.
            </p>
            <div className={styles.certNo}>Registration ID: {regNumber}</div>
          </div>

          <button className="btn-secondary" style={{ gap: "8px" }} onClick={() => alert("Certificate downloaded (Mock)")}>
            Download Certificate <Download size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
