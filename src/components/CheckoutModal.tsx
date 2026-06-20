"use client";

import { useState, useEffect } from "react";
import styles from "./CheckoutModal.module.css";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutModalProps {
  planId: "PRO_6M" | "PRO_1Y";
  planName: string;
  originalPrice: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderData {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planName: string;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  coupon: { code: string; discountValue: number } | null;
}

interface CouponResult {
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  finalPrice: number;
  description: string | null;
}

export default function CheckoutModal({
  planId,
  planName,
  originalPrice,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [couponInput, setCouponInput] = useState("");
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load Razorpay checkout.js
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const validateCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");
    setCouponResult(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: couponInput.trim().toUpperCase(), planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid coupon");
      setCouponResult(data.data);
    } catch (err: any) {
      setCouponError(err.message);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponResult(null);
    setCouponInput("");
    setCouponError("");
  };

  const handlePay = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId,
          couponCode: couponResult?.code ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create order");

      const od: OrderData = data.data;
      setOrderData(od);

      const options = {
        key: od.keyId,
        amount: od.amount,
        currency: od.currency,
        name: "MediCore Health",
        description: od.planName,
        order_id: od.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                planId,
                couponCode: couponResult?.code ?? undefined,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed");
            onSuccess();
          } catch (e: any) {
            setError(e.message);
          }
        },
        prefill: {},
        theme: { color: "#6366f1" },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const displayPrice = couponResult ? couponResult.finalPrice : originalPrice;
  const saving = couponResult ? couponResult.discountAmount : 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.header}>
          <div className={styles.planBadge}>MediCore Pro</div>
          <h2 className={styles.planName}>{planName}</h2>
        </div>

        {/* Coupon Section */}
        <div className={styles.couponSection}>
          {!couponResult ? (
            <div className={styles.couponRow}>
              <input
                className={styles.couponInput}
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
                placeholder="Have a coupon? (e.g. LAUNCH50)"
                disabled={validatingCoupon}
              />
              <button
                className={styles.applyBtn}
                onClick={validateCoupon}
                disabled={!couponInput.trim() || validatingCoupon}
              >
                {validatingCoupon ? "..." : "Apply"}
              </button>
            </div>
          ) : (
            <div className={styles.couponApplied}>
              <span className={styles.couponTag}>
                🎉 {couponResult.code} — {couponResult.discountValue}% off
              </span>
              <button className={styles.removeCoupon} onClick={removeCoupon}>Remove</button>
            </div>
          )}
          {couponError && <p className={styles.couponError}>{couponError}</p>}
          {couponResult?.description && (
            <p className={styles.couponDesc}>{couponResult.description}</p>
          )}
        </div>

        {/* Price Breakdown */}
        <div className={styles.priceCard}>
          <div className={styles.priceRow}>
            <span>Plan price</span>
            <span>₹{originalPrice}</span>
          </div>
          {saving > 0 && (
            <div className={`${styles.priceRow} ${styles.discount}`}>
              <span>Discount ({couponResult?.discountValue}%)</span>
              <span>−₹{saving}</span>
            </div>
          )}
          <div className={`${styles.priceRow} ${styles.total}`}>
            <span>Total (incl. GST)</span>
            <span>₹{displayPrice}</span>
          </div>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        <button
          className={styles.payBtn}
          onClick={handlePay}
          disabled={loading}
        >
          {loading ? "Processing..." : `Pay ₹${displayPrice} Securely`}
        </button>

        <p className={styles.secureNote}>
          🔒 Powered by Razorpay · UPI, Cards, Netbanking accepted
        </p>
      </div>
    </div>
  );
}
