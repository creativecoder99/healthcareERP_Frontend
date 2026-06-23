"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Stethoscope,
  Briefcase,
  DollarSign,
  FileText,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  CheckSquare,
} from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import { useAuthStore } from "../../../lib/auth-store";
import styles from "./profile.module.css";

const SPECIALISATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "General Medicine",
  "Neurology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Urology",
];

export default function DoctorProfile() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable Form Fields
  const [fullName, setFullName] = useState("");
  const [specialisation, setSpecialisation] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [bio, setBio] = useState("");

  // Read-only Details
  const [licenceNumber, setLicenceNumber] = useState("");
  const [licenceVerified, setLicenceVerified] = useState(false);
  const [orgName, setOrgName] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiClient.get("/doctor/profile");
        if (res.data?.success) {
          const profile = res.data.data;
          setFullName(profile.fullName || "");
          setSpecialisation(profile.specialisation || "");
          setConsultationFee(profile.consultationFee ? String(profile.consultationFee) : "0");
          setBio(profile.bio || "");
          setLicenceNumber(profile.licenceNumber || "");
          setLicenceVerified(profile.licenceVerified || false);
          setOrgName(profile.organisation?.name || null);
        }
      } catch (err) {
        console.error("Failed to load doctor profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!specialisation) e.specialisation = "Please select a specialisation";
    
    const feeNum = parseFloat(consultationFee);
    if (isNaN(feeNum) || feeNum < 0) {
      e.consultationFee = "Consultation fee must be a positive number";
    }

    if (bio.length > 600) {
      e.bio = "Bio cannot exceed 600 characters";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSuccess(false);
    setErrorMsg(null);

    const payload = {
      fullName,
      specialisation,
      consultationFee: parseFloat(consultationFee),
      bio,
    };

    try {
      const res = await apiClient.put("/doctor/profile", payload);
      if (res.data?.success) {
        setSuccess(true);
        // Sync local auth store so layout sidebar updates immediately
        if (user) {
          setUser({
            ...user,
            doctor: res.data.data,
          });
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err: any) {
      console.error("Doctor profile update failed:", err);
      const msg = err.response?.data?.error || "Failed to update profile. Please check inputs.";
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", width: "100%", height: "50vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <Loader2 size={24} className="animate-spin" color="#10b981" />
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Fetching profile settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profile}>
      <div className={styles.profileHeader}>
        <h2 className={styles.profileTitle}>Doctor Settings</h2>
        <p className={styles.profileSubtitle}>Manage your medical specialties, consultation metrics, and clinical details</p>
      </div>

      <form className={styles.formCard} onSubmit={handleSave}>
        {success && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <CheckCircle size={16} /> Changes saved successfully. Your details are updated.
          </div>
        )}

        {errorMsg && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {/* ─── 1. CLINICAL REGISTRATION (READ ONLY) ─── */}
        <div className={styles.sectionLabel}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={14} /> License &amp; Credentials
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Medical Licence Number</label>
            <input
              type="text"
              value={licenceNumber}
              disabled
              className={styles.formInput}
            />
            <span className={styles.formHint}>Your registered clinical identifier (Locked for security)</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Verification Status</label>
            <div>
              {licenceVerified ? (
                <span className={styles.badgeVerified}>✓ License Verified &amp; Approved</span>
              ) : (
                <span className={styles.badgeUnverified}>⚠ Pending Credentials Verification</span>
              )}
            </div>
          </div>

          <div className={`${styles.formGroup} ${styles.colSpan2}`}>
            <label className={styles.formLabel}>Affiliated Clinic / Hospital</label>
            <input
              type="text"
              value={orgName || "No organizational affiliation linked"}
              disabled
              className={styles.formInput}
            />
          </div>
        </div>

        {/* ─── 2. GENERAL PRACTICE INFO ─── */}
        <div className={styles.sectionLabel}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <User size={14} /> Profile Information
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Full Display Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={styles.formInput}
              disabled={saving}
              placeholder="e.g. Dr. Rajesh Kumar"
            />
            {errors.fullName && <span className={styles.formError}>{errors.fullName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Medical Specialisation</label>
            <select
              value={specialisation}
              onChange={(e) => setSpecialisation(e.target.value)}
              className={styles.formSelect}
              disabled={saving}
            >
              <option value="">Select Specialisation</option>
              {SPECIALISATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.specialisation && <span className={styles.formError}>{errors.specialisation}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Consultation Fee (INR)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>₹</span>
              <input
                type="number"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className={styles.formInput}
                disabled={saving}
                style={{ paddingLeft: 28 }}
                placeholder="e.g. 500"
                min="0"
              />
            </div>
            {errors.consultationFee && <span className={styles.formError}>{errors.consultationFee}</span>}
          </div>
        </div>

        {/* ─── 3. CLINICAL BIO ─── */}
        <div className={styles.sectionLabel}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={14} /> Professional Biography
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={`${styles.formGroup} ${styles.colSpan2}`}>
            <label className={styles.formLabel}>Biography (Max 600 characters)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={styles.formTextarea}
              disabled={saving}
              maxLength={600}
              placeholder="Provide a brief clinical biography visible to patients during online appointment booking..."
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span className={styles.formHint}>Include experience, credentials, and consulting hours details.</span>
              <span style={{ fontSize: "0.75rem", color: bio.length > 550 ? "red" : "#64748b" }}>
                {bio.length} / 600
              </span>
            </div>
            {errors.bio && <span className={styles.formError}>{errors.bio}</span>}
          </div>
        </div>

        {/* Action Controls */}
        <div className={styles.formFooter}>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#10b981", borderColor: "#10b981" }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving Changes...
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
