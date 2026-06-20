"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CheckoutModal from "@/components/CheckoutModal";
import styles from "./pricing.module.css";

const PLANS = [
  {
    id: "PRO_6M" as const,
    name: "Pro · 6 Months",
    price: 499,
    duration: "6 months",
    pricePerMonth: "~₹83/mo",
    features: [
      "Unlimited record uploads",
      "AI-powered health summaries",
      "Doctor linking & sharing",
      "Health chatbot (AI assistant)",
      "Download records as PDF",
      "Priority email support",
    ],
    locked: ["Family sharing (coming soon)"],
  },
  {
    id: "PRO_1Y" as const,
    name: "Pro · 1 Year",
    price: 999,
    duration: "12 months",
    pricePerMonth: "~₹83/mo",
    popular: true,
    badge: "Best Value — Save 50%",
    features: [
      "Everything in 6 months",
      "Full year of AI summaries",
      "Unlimited doctor linking",
      "Early access to new features",
      "Priority chat support",
      "Annual health trend report",
    ],
    locked: [],
  },
];

const FREE_FEATURES = [
  { label: "Upload up to 10 records", available: true },
  { label: "Doctor linking & access", available: true },
  { label: "AI health summaries", available: false },
  { label: "AI chatbot assistant", available: false },
  { label: "Unlimited uploads", available: false },
];

export default function PricingPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<{ id: "PRO_6M" | "PRO_1Y"; name: string; price: number } | null>(null);

  const handleSuccess = () => {
    setSelectedPlan(null);
    router.push("/patient/dashboard?upgraded=1");
  };

  return (
    <main className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroBadge}>MediCore Pro</div>
        <h1 className={styles.heroTitle}>Your health, AI-powered</h1>
        <p className={styles.heroSub}>
          Unlock AI summaries, the health chatbot, and unlimited uploads.<br />
          Cancel anytime. Prices inclusive of all taxes.
        </p>
      </div>

      {/* Plan Cards */}
      <div className={styles.plansGrid}>
        {/* Free Plan */}
        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <span className={styles.planName}>Free</span>
            <div className={styles.planPrice}>
              <span className={styles.priceAmount}>₹0</span>
              <span className={styles.pricePer}>forever</span>
            </div>
          </div>
          <ul className={styles.featureList}>
            {FREE_FEATURES.map((f) => (
              <li key={f.label} className={`${styles.feature} ${!f.available ? styles.featureLocked : ""}`}>
                <span className={styles.featureIcon}>{f.available ? "✓" : "✗"}</span>
                {f.label}
              </li>
            ))}
          </ul>
          <button className={styles.ctaSecondary} disabled>Current Plan</button>
        </div>

        {/* Pro Plans */}
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`${styles.planCard} ${plan.popular ? styles.planCardPopular : ""}`}
          >
            {plan.popular && <div className={styles.popularBadge}>{plan.badge}</div>}
            <div className={styles.planHeader}>
              <span className={styles.planName}>{plan.name}</span>
              <div className={styles.planPrice}>
                <span className={styles.priceAmount}>₹{plan.price}</span>
                <span className={styles.pricePer}>/ {plan.duration}</span>
              </div>
              <span className={styles.perMonth}>{plan.pricePerMonth} · incl. 18% GST</span>
            </div>

            <ul className={styles.featureList}>
              {plan.features.map((f) => (
                <li key={f} className={styles.feature}>
                  <span className={styles.featureIcon}>✓</span>
                  {f}
                </li>
              ))}
              {plan.locked.map((f) => (
                <li key={f} className={`${styles.feature} ${styles.featureSoon}`}>
                  <span className={styles.featureIcon}>⏳</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              className={styles.ctaPrimary}
              onClick={() => setSelectedPlan({ id: plan.id, name: plan.name, price: plan.price })}
            >
              Get Started →
            </button>
          </div>
        ))}
      </div>

      {/* Coupon hint */}
      <p className={styles.couponHint}>
        🎁 Have a coupon code? You can apply it in the checkout screen.
      </p>

      {/* Checkout Modal */}
      {selectedPlan && (
        <CheckoutModal
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          originalPrice={selectedPlan.price}
          onClose={() => setSelectedPlan(null)}
          onSuccess={handleSuccess}
        />
      )}
    </main>
  );
}
