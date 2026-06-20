"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Activity,
  Heart,
  Phone,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import { useAuthStore } from "../../../lib/auth-store";
import styles from "./profile.module.css";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function PatientProfile() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  
  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");

  // Insurance Info
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");

  // Form Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiClient.get("/patient/profile");
        if (res.data?.success) {
          const profile = res.data.data;
          
          setFullName(profile.fullName || "");
          if (profile.dateOfBirth) {
            setDob(new Date(profile.dateOfBirth).toISOString().split("T")[0]);
          }
          setGender(profile.gender || "");
          setBloodGroup(profile.bloodGroup || "");
          setHeight(profile.heightCm ? String(profile.heightCm) : "");
          setWeight(profile.weightKg ? String(profile.weightKg) : "");
          setAllergies(profile.allergies ? profile.allergies.join(", ") : "");
          setMedications(profile.currentMeds?.text || "");
          
          // Emergency contact mapping
          const ec = profile.emergencyContact;
          if (ec) {
            setEmergencyName(ec.name || "");
            setEmergencyPhone(ec.phone || "");
            setEmergencyRelation(ec.relation || "");
          }

          // Insurance mapping
          const ins = profile.insuranceInfo;
          if (ins) {
            setInsuranceProvider(ins.provider || "");
            setPolicyNumber(ins.policyNumber || "");
          }
        }
      } catch (err) {
        console.error("Failed to load patient profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!dob) e.dob = "Date of birth is required";
    if (!gender) e.gender = "Please select a gender";
    if (!bloodGroup) e.bloodGroup = "Please select a blood group";
    
    if (!emergencyName.trim()) e.emergencyName = "Emergency contact name is required";
    if (!emergencyPhone.trim()) e.emergencyPhone = "Emergency contact phone is required";
    if (!emergencyRelation) e.emergencyRelation = "Relationship is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSuccess(false);
    setErrorMsg(null);

    // Prepare payload
    const parsedHeight = height ? parseFloat(height) : null;
    const parsedWeight = weight ? parseFloat(weight) : null;
    const allergiesList = allergies
      ? allergies
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean)
      : [];
    const medicationsData = medications ? { text: medications } : null;
    
    const emergencyContact = {
      name: emergencyName,
      phone: emergencyPhone.replace(/\s+/g, ""),
      relation: emergencyRelation,
    };

    const insuranceInfo = insuranceProvider
      ? {
          provider: insuranceProvider,
          policyNumber: policyNumber,
        }
      : null;

    const payload = {
      fullName,
      dateOfBirth: dob,
      gender,
      bloodGroup,
      heightCm: parsedHeight,
      weightKg: parsedWeight,
      allergies: allergiesList,
      currentMeds: medicationsData,
      emergencyContact,
      insuranceInfo,
    };

    try {
      const res = await apiClient.put("/patient/profile", payload);
      if (res.data?.success) {
        setSuccess(true);
        // Sync local auth store user so sidebar updates name instantly
        if (user) {
          setUser({
            ...user,
            patient: res.data.data,
          });
        }
        // Scroll to top to show success banner
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err: any) {
      console.error("Profile update failed:", err);
      const msg = err.response?.data?.error || "Failed to update profile. Please check fields.";
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", width: "100%", height: "50vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 500 }}>Fetching profile settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profile}>
      <div className={styles.profileHeader}>
        <h2 className={styles.profileTitle}>Account Settings</h2>
        <p className={styles.profileSubtitle}>Manage your personal health profile and credentials</p>
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

        {/* ─── 1. PERSONAL DETAILS ─── */}
        <div className={styles.sectionLabel}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <User size={14} /> Personal Details
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={styles.formInput}
              disabled={saving}
              placeholder="e.g. Priya Sharma"
            />
            {errors.fullName && <span className={styles.formError}>{errors.fullName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className={styles.formInput}
              disabled={saving}
            />
            {errors.dob && <span className={styles.formError}>{errors.dob}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={styles.formSelect}
              disabled={saving}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not">Prefer not to say</option>
            </select>
            {errors.gender && <span className={styles.formError}>{errors.gender}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className={styles.formSelect}
              disabled={saving}
            >
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {errors.bloodGroup && <span className={styles.formError}>{errors.bloodGroup}</span>}
          </div>
        </div>

        {/* ─── 2. PHYSICAL VITALS ─── */}
        <div className={styles.sectionLabel}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={14} /> Physical Vitals
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Height (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className={styles.formInput}
              disabled={saving}
              placeholder="e.g. 165"
              min="50"
              max="250"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={styles.formInput}
              disabled={saving}
              placeholder="e.g. 62"
              min="1"
              max="300"
            />
          </div>
        </div>

        {/* ─── 3. MEDICAL DISCLOSURES ─── */}
        <div className={styles.sectionLabel}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Heart size={14} /> Medical Disclosures
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={`${styles.formGroup} ${styles.colSpan2}`}>
            <label className={styles.formLabel}>Known Allergies</label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className={styles.formInput}
              disabled={saving}
              placeholder="e.g. Penicillin, Peanuts, Latex (comma separated)"
            />
            <span className={styles.formHint}>Separate multiple items with commas</span>
          </div>

          <div className={`${styles.formGroup} ${styles.colSpan2}`}>
            <label className={styles.formLabel}>Current Medications</label>
            <textarea
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              className={styles.formTextarea}
              disabled={saving}
              placeholder="e.g. Metformin 500mg once daily after dinner"
            />
          </div>
        </div>

        {/* ─── 4. EMERGENCY CONTACT ─── */}
        <div className={styles.sectionLabel}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Phone size={14} /> Emergency Contact
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Contact Name</label>
            <input
              type="text"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              className={styles.formInput}
              disabled={saving}
              placeholder="e.g. Raj Kumar"
            />
            {errors.emergencyName && <span className={styles.formError}>{errors.emergencyName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Contact Phone</label>
            <input
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              className={styles.formInput}
              disabled={saving}
              placeholder="e.g. 9876543210"
            />
            {errors.emergencyPhone && <span className={styles.formError}>{errors.emergencyPhone}</span>}
          </div>

          <div className={`${styles.formGroup} ${styles.colSpan2}`}>
            <label className={styles.formLabel}>Relationship</label>
            <select
              value={emergencyRelation}
              onChange={(e) => setEmergencyRelation(e.target.value)}
              className={styles.formSelect}
              disabled={saving}
            >
              <option value="">Select relationship</option>
              <option value="spouse">Spouse / Partner</option>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="sibling">Sibling</option>
              <option value="friend">Friend</option>
              <option value="other">Other</option>
            </select>
            {errors.emergencyRelation && <span className={styles.formError}>{errors.emergencyRelation}</span>}
          </div>
        </div>

        {/* ─── 5. INSURANCE DETAILS ─── */}
        <div className={styles.sectionLabel}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={14} /> Insurance Information (Optional)
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Insurance Provider</label>
            <input
              type="text"
              value={insuranceProvider}
              onChange={(e) => setInsuranceProvider(e.target.value)}
              className={styles.formInput}
              disabled={saving}
              placeholder="e.g. HDFC Ergo Health"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Policy Number</label>
            <input
              type="text"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              className={styles.formInput}
              disabled={saving}
              placeholder="e.g. POL-9876543"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.formFooter}>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
