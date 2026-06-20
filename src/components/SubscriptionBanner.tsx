"use client";

import Link from "next/link";
import styles from "./SubscriptionBanner.module.css";

interface SubscriptionBannerProps {
  feature?: string; // e.g. "AI chat" or "full AI summary"
  compact?: boolean;
}

export default function SubscriptionBanner({ feature = "this feature", compact }: SubscriptionBannerProps) {
  if (compact) {
    return (
      <div className={styles.compact}>
        <span className={styles.lockIcon}>🔒</span>
        <span className={styles.compactText}>
          Upgrade to Pro to unlock {feature}
        </span>
        <Link href="/pricing" className={styles.compactCta}>Upgrade</Link>
      </div>
    );
  }

  return (
    <div className={styles.banner}>
      <div className={styles.glow} />
      <div className={styles.icon}>✨</div>
      <div className={styles.content}>
        <h3 className={styles.title}>Unlock {feature}</h3>
        <p className={styles.desc}>
          Get full access to AI-powered insights, PDF summaries, and the health chatbot with a Pro plan.
        </p>
      </div>
      <Link href="/pricing" className={styles.cta}>
        View Plans
      </Link>
    </div>
  );
}
