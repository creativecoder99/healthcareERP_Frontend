"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CheckoutModal from "@/components/CheckoutModal";
import styles from "./billing.module.css";

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  couponCode: string | null;
  discountAmount: number;
  createdAt: string;
}

const PLAN_LABELS: Record<string, string> = {
  FREE: "Free",
  PRO_6M: "Pro · 6 Months",
  PRO_1Y: "Pro · 1 Year",
};

const PLAN_COLORS: Record<string, string> = {
  FREE: "#64748b",
  PRO_6M: "#618764",
  PRO_1Y: "#2B5748",
};

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: "PRO_6M" | "PRO_1Y"; name: string; price: number } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [subRes, invRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/subscription`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/invoices`, { credentials: "include" }),
        ]);
        const subData = await subRes.json();
        const invData = await invRes.json();
        if (subData.success) setSub(subData.data);
        if (invData.success) setInvoices(invData.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleCancel = async () => {
    if (!confirm("Your access will continue until the end of the current period. Cancel anyway?")) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/cancel`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setSub(data.data);
    } catch {}
    setCancelLoading(false);
  };

  const handleUpgradeSuccess = async () => {
    setSelectedPlan(null);
    setLoading(true);
    const [subRes, invRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/subscription`, { credentials: "include" }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/invoices`, { credentials: "include" }),
    ]);
    const subData = await subRes.json();
    const invData = await invRes.json();
    if (subData.success) setSub(subData.data);
    if (invData.success) setInvoices(invData.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>Loading billing information…</div>
      </div>
    );
  }

  const isPro = sub && sub.plan !== "FREE" && sub.status === "ACTIVE";
  const periodEnd = sub ? new Date(sub.currentPeriodEnd) : null;
  const daysLeft = periodEnd ? Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Billing & Subscription</h1>

        {/* Current Plan Card */}
        <div className={styles.currentPlanCard}>
          <div className={styles.planInfo}>
            <div
              className={styles.planBadge}
              style={{ background: `linear-gradient(135deg, ${PLAN_COLORS[sub?.plan ?? "FREE"]}, #9CB080)` }}
            >
              {PLAN_LABELS[sub?.plan ?? "FREE"] ?? sub?.plan ?? "Free"}
            </div>
            {isPro ? (
              <>
                <p className={styles.planStatus}>
                  Active until <strong>{periodEnd?.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>
                </p>
                <p className={styles.planDays}>{daysLeft} days remaining</p>
                {sub?.cancelAtPeriodEnd && (
                  <p className={styles.cancelNotice}>
                    ⚠️ Subscription will not renew at period end.
                  </p>
                )}
              </>
            ) : (
              <p className={styles.planStatus}>Free plan — limited features</p>
            )}
          </div>

          <div className={styles.planActions}>
            {isPro ? (
              <>
                <button
                  className={styles.upgradeBtn}
                  onClick={() => setSelectedPlan({ id: "PRO_1Y", name: "Pro · 1 Year", price: 999 })}
                >
                  Extend / Upgrade
                </button>
                {!sub?.cancelAtPeriodEnd && (
                  <button
                    className={styles.cancelBtn}
                    onClick={handleCancel}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? "Cancelling…" : "Cancel Subscription"}
                  </button>
                )}
              </>
            ) : (
              <Link href="/pricing" className={styles.upgradeLink}>
                Upgrade to Pro →
              </Link>
            )}
          </div>
        </div>

        {/* Feature Summary */}
        <div className={styles.featureGrid}>
          {[
            { icon: "🤖", label: "AI Chatbot", available: isPro },
            { icon: "📄", label: "AI Summaries", available: isPro },
            { icon: "♾️", label: "Unlimited Uploads", available: isPro },
            { icon: "🔗", label: "Doctor Linking", available: true },
          ].map((f) => (
            <div key={f.label} className={`${styles.featureItem} ${!f.available ? styles.featureItemLocked : ""}`}>
              <span className={styles.featureItemIcon}>{f.icon}</span>
              <span className={styles.featureItemLabel}>{f.label}</span>
              <span className={styles.featureItemStatus}>{f.available ? "Active" : "Locked"}</span>
            </div>
          ))}
        </div>

        {/* Invoice History */}
        <div className={styles.invoiceSection}>
          <h2 className={styles.subHeading}>Payment History</h2>
          {invoices.length === 0 ? (
            <p className={styles.emptyInvoice}>No payments yet.</p>
          ) : (
            <div className={styles.invoiceTable}>
              <div className={styles.invoiceHeader}>
                <span>Date</span>
                <span>Plan</span>
                <span>Discount</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {invoices.map((inv) => (
                <div key={inv.id} className={styles.invoiceRow}>
                  <span>{new Date(inv.createdAt).toLocaleDateString("en-IN")}</span>
                  <span>—</span>
                  <span>{inv.couponCode ? `${inv.couponCode} (−₹${inv.discountAmount})` : "—"}</span>
                  <span>₹{inv.amount.toFixed(2)}</span>
                  <span className={`${styles.statusBadge} ${inv.status === "SUCCEEDED" ? styles.statusSuccess : styles.statusFailed}`}>
                    {inv.status === "SUCCEEDED" ? "Paid" : inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPlan && (
        <CheckoutModal
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          originalPrice={selectedPlan.price}
          onClose={() => setSelectedPlan(null)}
          onSuccess={handleUpgradeSuccess}
        />
      )}
    </div>
  );
}
