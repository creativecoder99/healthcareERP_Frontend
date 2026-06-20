"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail, Phone, Key } from "lucide-react";
import styles from "./LoginPage.module.css";
import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../lib/auth-store";

type Tab = "password" | "email-otp" | "phone-otp";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("password");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  const [otpRequested, setOtpRequested] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  // Cooldown countdown tick
  useEffect(() => {
    if (cooldown > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setCooldown((c) => c - 1);
      }, 1000);
    } else {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    }
  }, [cooldown]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setErrors({});
    setSubmitError(null);
    setDevOtp(null);
    setOtp("");
    setOtpRequested(false);
    setSuccessMsg(null);
  };

  const validateEmail = (val: string) => {
    return /\S+@\S+\.\S+/.test(val);
  };

  const validatePhone = (val: string) => {
    return /^[0-9\s+-]{10,15}$/.test(val);
  };

  const handleSendOtp = async () => {
    const errs: Record<string, string> = {};
    setSubmitError(null);
    setDevOtp(null);
    setSuccessMsg(null);

    let payload: any = {};

    if (tab === "email-otp") {
      if (!email.trim()) {
        errs.email = "Email is required";
      } else if (!validateEmail(email)) {
        errs.email = "Enter a valid email address";
      }
      payload.email = email;
    } else if (tab === "phone-otp") {
      if (!phone.trim()) {
        errs.phone = "Phone number is required";
      } else if (!validatePhone(phone)) {
        errs.phone = "Enter a valid phone number (10-15 digits)";
      }
      payload.phone = phone.replace(/\s+/g, "");
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/auth/otp/request", payload);
      setOtpRequested(true);
      setCooldown(60); // 60 seconds cooldown
      setSuccessMsg("OTP sent successfully!");

      // Dev mode OTP capture
      if (response.data?.otp) {
        setDevOtp(response.data.otp);
      }
      setErrors({});
    } catch (err: any) {
      console.error("OTP send failed:", err);
      const errMsg = err.response?.data?.error || "Failed to send OTP. Check your details.";
      setSubmitError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    setSubmitError(null);
    setSuccessMsg(null);

    let payload: any = {};

    if (tab === "password") {
      if (!email.trim()) {
        errs.email = "Email is required";
      } else if (!validateEmail(email)) {
        errs.email = "Enter a valid email address";
      }
      if (!password) {
        errs.password = "Password is required";
      }
      payload = { email, password };
    } else if (tab === "email-otp" || tab === "phone-otp") {
      const target = tab === "email-otp" ? email : phone;
      const targetName = tab === "email-otp" ? "email" : "phone";

      if (!target.trim()) {
        errs[targetName] = `${targetName.charAt(0).toUpperCase() + targetName.slice(1)} is required`;
      } else if (tab === "email-otp" && !validateEmail(email)) {
        errs.email = "Enter a valid email address";
      } else if (tab === "phone-otp" && !validatePhone(phone)) {
        errs.phone = "Enter a valid phone number";
      }

      if (!otpRequested) {
        errs.otp = "Please request an OTP code first";
      } else if (!otp || otp.length !== 6) {
        errs.otp = "Enter a valid 6-digit OTP code";
      }

      payload = {
        [targetName]: target.replace(/\s+/g, ""),
        otp,
      };
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/auth/login", payload);
      const responseData = response.data?.data;
      
      if (responseData) {
        useAuthStore.getState().setAccessToken(responseData.accessToken);
        useAuthStore.getState().setUser(responseData.user);
        
        setSuccessMsg(`Welcome back, ${responseData.user.patient?.fullName || responseData.user.doctor?.fullName || "User"}! Redirecting...`);
        
        // Brief delay before redirecting to dashboard
        setTimeout(() => {
          if (responseData.user.role === "PATIENT") {
            router.push("/patient/dashboard");
          } else {
            router.push("/");
          }
        }, 1500);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      const errMsg = err.response?.data?.error || "Login failed. Please verify credentials.";
      setSubmitError(errMsg);
      
      if (err.response?.data?.details) {
        const serverErrors: Record<string, string> = {};
        Object.entries(err.response.data.details).forEach(([key, value]: any) => {
          serverErrors[key] = Array.isArray(value) ? value[0] : value;
        });
        setErrors(serverErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgBlob1} />
      <div className={styles.bgBlob2} />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className={styles.pageHeader}>
        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoIcon}>
            <Activity size={19} color="#fff" strokeWidth={2.5} />
          </div>
          <span className={styles.logoText}>MediCore</span>
        </Link>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.loginScreen}>
          {/* Header titles */}
          <div className={styles.formHeader}>
            <span className="badge-green">Sign In</span>
            <h1 className={styles.formTitle}>Access your Health Vault</h1>
            <p className={styles.formSubtitle}>Choose your preferred login method below</p>
          </div>

          {/* Toggle Methods Tab Bar */}
          <div className={styles.tabsContainer}>
            <button
              type="button"
              className={`${styles.tabButton} ${tab === "password" ? styles.tabButtonActive : ""}`}
              onClick={() => handleTabChange("password")}
            >
              Password
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${tab === "email-otp" ? styles.tabButtonActive : ""}`}
              onClick={() => handleTabChange("email-otp")}
            >
              Email OTP
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${tab === "phone-otp" ? styles.tabButtonActive : ""}`}
              onClick={() => handleTabChange("phone-otp")}
            >
              Phone OTP
            </button>
          </div>

          {/* Login Card */}
          <form className={styles.loginCard} onSubmit={handleLogin} noValidate>
            
            {/* Notices: Errors/Success */}
            {submitError && (
              <div style={{ color: "#d35400", backgroundColor: "#fcf2eb", padding: 12, borderRadius: 8, fontSize: "0.9rem", border: "1px solid rgba(211, 84, 0, 0.15)" }}>
                {submitError}
              </div>
            )}
            
            {successMsg && (
              <div style={{ color: "#225c34", backgroundColor: "#e8f2ea", padding: 12, borderRadius: 8, fontSize: "0.9rem", border: "1px solid rgba(34, 92, 52, 0.15)" }}>
                {successMsg}
              </div>
            )}

            {devOtp && (
              <div style={{ color: "#8a6b18", backgroundColor: "#fef8e7", padding: 12, borderRadius: 8, fontSize: "0.9rem", border: "1px solid rgba(197, 155, 39, 0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                <Key size={15} />
                <span><strong>[Dev Mode OTP]</strong> Your OTP code is: <strong>{devOtp}</strong></span>
              </div>
            )}

            {/* Email + Password Form */}
            {tab === "password" && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                    <input
                      type="email"
                      className={`${styles.formInput} ${errors.email ? styles.formInputError : ""}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. priya@example.com"
                      disabled={loading}
                      style={{ paddingLeft: 38 }}
                      required
                    />
                  </div>
                  {errors.email && <span className={styles.formError}>{errors.email}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password</label>
                  <div className={styles.passwordWrap}>
                    <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                    <input
                      type={showPass ? "text" : "password"}
                      className={`${styles.formInput} ${errors.password ? styles.formInputError : ""}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      style={{ paddingLeft: 38, paddingRight: 40 }}
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPass((s) => !s)}
                      disabled={loading}
                      tabIndex={-1}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <span className={styles.formError}>{errors.password}</span>}
                  <div style={{ textAlign: "right", marginTop: 4 }}>
                    <Link href="/forgot-password" style={{ fontSize: "0.775rem", color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
                      Forgot Password?
                    </Link>
                  </div>
                </div>
              </>
            )}

            {/* Email + OTP Form */}
            {tab === "email-otp" && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <div className={styles.otpRow}>
                    <div className={styles.otpInputGroup} style={{ position: "relative" }}>
                      <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                      <input
                        type="email"
                        className={`${styles.formInput} ${errors.email ? styles.formInputError : ""}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. priya@example.com"
                        disabled={loading}
                        style={{ paddingLeft: 38 }}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      className={`${styles.sendOtpBtn} btn-secondary`}
                      onClick={handleSendOtp}
                      disabled={loading || cooldown > 0}
                    >
                      {cooldown > 0 ? `Resend (${cooldown}s)` : "Get OTP"}
                    </button>
                  </div>
                  {errors.email && <span className={styles.formError}>{errors.email}</span>}
                </div>

                {otpRequested && (
                  <div className={styles.formGroup} style={{ animation: "fadeUp 0.3s ease" }}>
                    <label className={styles.formLabel}>Verification Code (OTP)</label>
                    <div style={{ position: "relative" }}>
                      <Key size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                      <input
                        type="text"
                        maxLength={6}
                        className={`${styles.formInput} ${errors.otp ? styles.formInputError : ""}`}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        disabled={loading}
                        style={{ paddingLeft: 38, letterSpacing: 3, fontWeight: "bold" }}
                        required
                      />
                    </div>
                    {errors.otp && <span className={styles.formError}>{errors.otp}</span>}
                  </div>
                )}
              </>
            )}

            {/* Phone + OTP Form */}
            {tab === "phone-otp" && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone Number</label>
                  <div className={styles.otpRow}>
                    <div className={styles.otpInputGroup} style={{ position: "relative" }}>
                      <Phone size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                      <input
                        type="tel"
                        className={`${styles.formInput} ${errors.phone ? styles.formInputError : ""}`}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        disabled={loading}
                        style={{ paddingLeft: 38 }}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      className={`${styles.sendOtpBtn} btn-secondary`}
                      onClick={handleSendOtp}
                      disabled={loading || cooldown > 0}
                    >
                      {cooldown > 0 ? `Resend (${cooldown}s)` : "Get OTP"}
                    </button>
                  </div>
                  {errors.phone && <span className={styles.formError}>{errors.phone}</span>}
                </div>

                {otpRequested && (
                  <div className={styles.formGroup} style={{ animation: "fadeUp 0.3s ease" }}>
                    <label className={styles.formLabel}>Verification Code (OTP)</label>
                    <div style={{ position: "relative" }}>
                      <Key size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                      <input
                        type="text"
                        maxLength={6}
                        className={`${styles.formInput} ${errors.otp ? styles.formInputError : ""}`}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        disabled={loading}
                        style={{ paddingLeft: 38, letterSpacing: 3, fontWeight: "bold" }}
                        required
                      />
                    </div>
                    {errors.otp && <span className={styles.formError}>{errors.otp}</span>}
                  </div>
                )}
              </>
            )}

            {/* Login CTA Button */}
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || (tab !== "password" && !otpRequested)}
              style={{ width: "100%", height: 46, fontSize: "1rem", marginTop: 8 }}
            >
              {loading ? "Authenticating..." : "Sign In"}
              <ArrowRight size={16} style={{ marginLeft: 8 }} />
            </button>
          </form>

          {/* Prompt to Sign Up */}
          <p className={styles.signupPrompt}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className={styles.signupLink}>
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
