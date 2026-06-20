"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  User,
  Eye,
  EyeOff,
  Check,
  CheckCircle,
  Stethoscope,
  Building2,
  Building,
  FlaskConical,
} from "lucide-react";
import styles from "./SignupPage.module.css";
import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../lib/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "patient" | "provider" | null;
type Step = 1 | 2 | 3;
type ProviderType = "doctor" | "clinic" | "hospital" | "lab";
type Screen = "role" | "form" | "success";

// ─── Static data ──────────────────────────────────────────────────────────────

const SPECIALISATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "General Medicine",
  "General Surgery",
  "Gynaecology & Obstetrics",
  "Nephrology",
  "Neurology",
  "Neurosurgery",
  "Oncology",
  "Ophthalmology",
  "Orthopaedics",
  "Paediatrics",
  "Psychiatry & Mental Health",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Urology",
  "Other",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Chandigarh",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
];

const PROVIDER_TYPES: {
  value: ProviderType;
  label: string;
  icon: React.ReactNode;
  sub: string;
}[] = [
  {
    value: "doctor",
    label: "Doctor / Specialist",
    icon: <Stethoscope size={20} />,
    sub: "Individual practitioner",
  },
  {
    value: "clinic",
    label: "Clinic",
    icon: <Building2 size={20} />,
    sub: "Private / multi-specialty",
  },
  {
    value: "hospital",
    label: "Hospital",
    icon: <Building size={20} />,
    sub: "Inpatient & outpatient",
  },
  {
    value: "lab",
    label: "Diagnostic Lab",
    icon: <FlaskConical size={20} />,
    sub: "Pathology / radiology",
  },
];

// ─── Initial form state ───────────────────────────────────────────────────────

const initPatient = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  height: "",
  weight: "",
  allergies: "",
  medications: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
  insuranceProvider: "",
  policyNumber: "",
  terms: false,
};

const initProvider = {
  providerType: "doctor" as ProviderType,
  orgName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  specialisation: "",
  licenseNumber: "",
  experience: "",
  consultationFee: "",
  affiliation: "",
  regNumber: "",
  facilityType: "",
  specialities: "",
  doctorCount: "",
  nablAccredited: "yes",
  address: "",
  city: "",
  state: "",
  pincode: "",
  website: "",
  terms: false,
};

type PatientData = typeof initPatient;
type ProviderData = typeof initProvider;
type ChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;

// ─── Shared primitives ───────────────────────────────────────────────────────

function Field({
  label,
  error,
  optional,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.formGroup} ${className ?? ""}`}>
      <label className={styles.formLabel}>
        {label}
        {optional && <span className={styles.optionalTag}>optional</span>}
      </label>
      {children}
      {error && <span className={styles.formError}>{error}</span>}
      {hint && !error && <span className={styles.formHint}>{hint}</span>}
    </div>
  );
}

function Inp({
  hasError,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return (
    <input
      className={`${styles.formInput} ${hasError ? styles.formInputError : ""}`}
      {...props}
    />
  );
}

function Sel({
  hasError,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  return (
    <select
      className={`${styles.formSelect} ${hasError ? styles.formInputError : ""}`}
      {...props}
    >
      {children}
    </select>
  );
}

function Txt({
  hasError,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  return (
    <textarea
      className={`${styles.formTextarea} ${hasError ? styles.formInputError : ""}`}
      rows={3}
      {...props}
    />
  );
}

function PwdField({
  label,
  name,
  value,
  onChange,
  error,
  show,
  onToggle,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  show: boolean;
  onToggle: () => void;
  hint?: string;
}) {
  return (
    <Field label={label} error={error} hint={hint}>
      <div className={styles.passwordWrap}>
        <Inp
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          hasError={!!error}
          style={{ paddingRight: 42 }}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={onToggle}
          tabIndex={-1}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </Field>
  );
}

// ─── Patient Step 1 — Account ─────────────────────────────────────────────────

function PatientStep1({
  data,
  errors,
  onChange,
  showPass,
  showConfirmPass,
  onTogglePass,
  onToggleConfirmPass,
  emailVerified,
  phoneVerified,
  emailOtp,
  phoneOtp,
  emailOtpRequested,
  phoneOtpRequested,
  sendingEmailOtp,
  sendingPhoneOtp,
  verifyingEmailOtp,
  verifyingPhoneOtp,
  devEmailOtp,
  devPhoneOtp,
  onSendOtp,
  onVerifyOtp,
  onOtpChange,
}: {
  data: PatientData;
  errors: Record<string, string>;
  onChange: (e: ChangeEvent) => void;
  showPass: boolean;
  showConfirmPass: boolean;
  onTogglePass: () => void;
  onToggleConfirmPass: () => void;
  emailVerified: boolean;
  phoneVerified: boolean;
  emailOtp: string;
  phoneOtp: string;
  emailOtpRequested: boolean;
  phoneOtpRequested: boolean;
  sendingEmailOtp: boolean;
  sendingPhoneOtp: boolean;
  verifyingEmailOtp: boolean;
  verifyingPhoneOtp: boolean;
  devEmailOtp: string;
  devPhoneOtp: string;
  onSendOtp: (type: "email" | "phone") => void;
  onVerifyOtp: (type: "email" | "phone") => void;
  onOtpChange: (type: "email" | "phone", value: string) => void;
}) {
  return (
    <>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Account Setup</h2>
        <p className={styles.formSubtitle}>
          Create your secure MediCore patient account
        </p>
      </div>
      <div className={styles.formGrid}>
        <Field
          label="Full Name"
          error={errors.fullName}
          className={styles.colSpan2}
        >
          <Inp
            name="fullName"
            value={data.fullName}
            onChange={onChange}
            placeholder="e.g. Priya Sharma"
            hasError={!!errors.fullName}
          />
        </Field>
        
        {/* Email Address with OTP Verify */}
        <Field 
          label="Email Address" 
          error={errors.email}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Inp
              type="email"
              name="email"
              value={data.email}
              onChange={onChange}
              placeholder="priya@example.com"
              hasError={!!errors.email}
              disabled={emailVerified}
              style={{ flex: 1 }}
            />
            {emailVerified ? (
              <span className={styles.otpBadge}>
                <Check size={12} /> Verified
              </span>
            ) : (
              !emailOtpRequested && (
                <button
                  type="button"
                  onClick={() => onSendOtp("email")}
                  disabled={sendingEmailOtp || !data.email}
                  className={`${styles.otpBtn} ${styles.otpBtnSend}`}
                >
                  {sendingEmailOtp ? "Sending..." : "Verify"}
                </button>
              )
            )}
          </div>

          {!emailVerified && emailOtpRequested && (
            <div className={styles.otpRow}>
              <Inp
                type="text"
                placeholder="6-digit OTP"
                value={emailOtp}
                onChange={(e) => onOtpChange("email", e.target.value)}
                maxLength={6}
                className={styles.otpInput}
              />
              <button
                type="button"
                onClick={() => onVerifyOtp("email")}
                disabled={verifyingEmailOtp || emailOtp.length !== 6}
                className={`${styles.otpBtn} ${styles.otpBtnVerify}`}
              >
                {verifyingEmailOtp ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={() => onSendOtp("email")}
                disabled={sendingEmailOtp}
                className={`${styles.otpBtn} ${styles.otpBtnSend}`}
              >
                Resend
              </button>
            </div>
          )}

          {!emailVerified && devEmailOtp && (
            <div className={styles.otpDevBox}>
              <span>[Dev Mode] Generated OTP:</span>
              <strong className={styles.otpDevCode}>{devEmailOtp}</strong>
            </div>
          )}
        </Field>

        {/* Phone Number with OTP Verify */}
        <Field 
          label="Phone Number" 
          error={errors.phone}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Inp
              type="tel"
              name="phone"
              value={data.phone}
              onChange={onChange}
              placeholder="+91 98765 43210"
              hasError={!!errors.phone}
              disabled={phoneVerified}
              style={{ flex: 1 }}
            />
            {phoneVerified ? (
              <span className={styles.otpBadge}>
                <Check size={12} /> Verified
              </span>
            ) : (
              !phoneOtpRequested && (
                <button
                  type="button"
                  onClick={() => onSendOtp("phone")}
                  disabled={sendingPhoneOtp || !data.phone}
                  className={`${styles.otpBtn} ${styles.otpBtnSend}`}
                >
                  {sendingPhoneOtp ? "Sending..." : "Verify"}
                </button>
              )
            )}
          </div>

          {!phoneVerified && phoneOtpRequested && (
            <div className={styles.otpRow}>
              <Inp
                type="text"
                placeholder="6-digit OTP"
                value={phoneOtp}
                onChange={(e) => onOtpChange("phone", e.target.value)}
                maxLength={6}
                className={styles.otpInput}
              />
              <button
                type="button"
                onClick={() => onVerifyOtp("phone")}
                disabled={verifyingPhoneOtp || phoneOtp.length !== 6}
                className={`${styles.otpBtn} ${styles.otpBtnVerify}`}
              >
                {verifyingPhoneOtp ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={() => onSendOtp("phone")}
                disabled={sendingPhoneOtp}
                className={`${styles.otpBtn} ${styles.otpBtnSend}`}
              >
                Resend
              </button>
            </div>
          )}

          {!phoneVerified && devPhoneOtp && (
            <div className={styles.otpDevBox}>
              <span>[Dev Mode] Generated OTP:</span>
              <strong className={styles.otpDevCode}>{devPhoneOtp}</strong>
            </div>
          )}
        </Field>

        <div className={styles.colSpan2}>
          <PwdField
            label="Password"
            name="password"
            value={data.password}
            onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
            error={errors.password}
            show={showPass}
            onToggle={onTogglePass}
            hint="Minimum 8 characters"
          />
        </div>
        <div className={styles.colSpan2}>
          <PwdField
            label="Confirm Password"
            name="confirmPassword"
            value={data.confirmPassword}
            onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
            error={errors.confirmPassword}
            show={showConfirmPass}
            onToggle={onToggleConfirmPass}
          />
        </div>
      </div>
    </>
  );
}

// ─── Patient Step 2 — Health Profile ─────────────────────────────────────────

function PatientStep2({
  data,
  errors,
  onChange,
}: {
  data: PatientData;
  errors: Record<string, string>;
  onChange: (e: ChangeEvent) => void;
}) {
  return (
    <>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Health Profile</h2>
        <p className={styles.formSubtitle}>
          Help your doctors understand you better from day one
        </p>
      </div>
      <div className={styles.formGrid}>
        <Field label="Date of Birth" error={errors.dob}>
          <Inp
            type="date"
            name="dob"
            value={data.dob}
            onChange={onChange}
            hasError={!!errors.dob}
          />
        </Field>
        <Field label="Gender" error={errors.gender}>
          <Sel
            name="gender"
            value={data.gender}
            onChange={onChange}
            hasError={!!errors.gender}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not">Prefer not to say</option>
          </Sel>
        </Field>
        <Field label="Blood Group" error={errors.bloodGroup}>
          <Sel
            name="bloodGroup"
            value={data.bloodGroup}
            onChange={onChange}
            hasError={!!errors.bloodGroup}
          >
            <option value="">Select blood group</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Sel>
        </Field>
        <Field label="Height (cm)" optional>
          <Inp
            type="number"
            name="height"
            value={data.height}
            onChange={onChange}
            placeholder="e.g. 165"
            min="50"
            max="300"
          />
        </Field>
        <Field label="Weight (kg)" optional>
          <Inp
            type="number"
            name="weight"
            value={data.weight}
            onChange={onChange}
            placeholder="e.g. 65"
            min="1"
            max="300"
          />
        </Field>
        <Field
          label="Known Allergies"
          optional
          hint="e.g. Penicillin, Peanuts, Latex"
          className={styles.colSpan2}
        >
          <Txt
            name="allergies"
            value={data.allergies}
            onChange={onChange}
            placeholder="List any known allergies, or leave blank if none"
          />
        </Field>
        <Field
          label="Current Medications"
          optional
          hint="Include dosage if known"
          className={styles.colSpan2}
        >
          <Txt
            name="medications"
            value={data.medications}
            onChange={onChange}
            placeholder="e.g. Metformin 500mg twice daily — or leave blank"
          />
        </Field>
      </div>
    </>
  );
}

// ─── Patient Step 3 — Emergency & Consent ─────────────────────────────────────

function PatientStep3({
  data,
  errors,
  onChange,
}: {
  data: PatientData;
  errors: Record<string, string>;
  onChange: (e: ChangeEvent) => void;
}) {
  return (
    <>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Emergency &amp; Consent</h2>
        <p className={styles.formSubtitle}>
          Safety information and your final agreement
        </p>
      </div>
      <div className={styles.formGrid}>
        <div className={`${styles.sectionLabel} ${styles.colSpan2}`}>
          Emergency Contact
        </div>
        <Field label="Contact Full Name" error={errors.emergencyName}>
          <Inp
            name="emergencyName"
            value={data.emergencyName}
            onChange={onChange}
            placeholder="e.g. Raj Kumar"
            hasError={!!errors.emergencyName}
          />
        </Field>
        <Field label="Contact Phone" error={errors.emergencyPhone}>
          <Inp
            type="tel"
            name="emergencyPhone"
            value={data.emergencyPhone}
            onChange={onChange}
            placeholder="+91 98765 43210"
            hasError={!!errors.emergencyPhone}
          />
        </Field>
        <Field
          label="Relationship"
          error={errors.emergencyRelation}
          className={styles.colSpan2}
        >
          <Sel
            name="emergencyRelation"
            value={data.emergencyRelation}
            onChange={onChange}
            hasError={!!errors.emergencyRelation}
          >
            <option value="">Select relationship</option>
            <option value="spouse">Spouse / Partner</option>
            <option value="parent">Parent</option>
            <option value="child">Child</option>
            <option value="sibling">Sibling</option>
            <option value="friend">Friend</option>
            <option value="other">Other</option>
          </Sel>
        </Field>

        <div className={`${styles.sectionLabel} ${styles.colSpan2}`}>
          Insurance (Optional)
        </div>
        <Field label="Insurance Provider" optional>
          <Inp
            name="insuranceProvider"
            value={data.insuranceProvider}
            onChange={onChange}
            placeholder="e.g. Star Health, HDFC Ergo"
          />
        </Field>
        <Field label="Policy Number" optional>
          <Inp
            name="policyNumber"
            value={data.policyNumber}
            onChange={onChange}
            placeholder="e.g. STAR-12345678"
          />
        </Field>

        <div className={`${styles.colSpan2} ${styles.termsRow}`}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="terms"
              checked={data.terms}
              onChange={onChange}
              className={styles.checkboxInput}
            />
            <span>
              I agree to MediCore&apos;s{" "}
              <a
                href="/terms"
                className={styles.termsLink}
                target="_blank"
                rel="noreferrer"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className={styles.termsLink}
                target="_blank"
                rel="noreferrer"
              >
                Privacy Policy
              </a>
              . I understand that my health data is encrypted and I control who
              can access it.
            </span>
          </label>
          {errors.terms && (
            <span className={styles.formError}>{errors.terms}</span>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Provider Step 1 — Account & Type ────────────────────────────────────────

function ProviderStep1({
  data,
  errors,
  onChange,
  showPass,
  showConfirmPass,
  onTogglePass,
  onToggleConfirmPass,
  emailVerified,
  phoneVerified,
  emailOtp,
  phoneOtp,
  emailOtpRequested,
  phoneOtpRequested,
  sendingEmailOtp,
  sendingPhoneOtp,
  verifyingEmailOtp,
  verifyingPhoneOtp,
  devEmailOtp,
  devPhoneOtp,
  onSendOtp,
  onVerifyOtp,
  onOtpChange,
}: {
  data: ProviderData;
  errors: Record<string, string>;
  onChange: (e: ChangeEvent) => void;
  showPass: boolean;
  showConfirmPass: boolean;
  onTogglePass: () => void;
  onToggleConfirmPass: () => void;
  emailVerified: boolean;
  phoneVerified: boolean;
  emailOtp: string;
  phoneOtp: string;
  emailOtpRequested: boolean;
  phoneOtpRequested: boolean;
  sendingEmailOtp: boolean;
  sendingPhoneOtp: boolean;
  verifyingEmailOtp: boolean;
  verifyingPhoneOtp: boolean;
  devEmailOtp: string;
  devPhoneOtp: string;
  onSendOtp: (type: "email" | "phone") => void;
  onVerifyOtp: (type: "email" | "phone") => void;
  onOtpChange: (type: "email" | "phone", value: string) => void;
}) {
  return (
    <>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Provider Account</h2>
        <p className={styles.formSubtitle}>
          Create your MediCore healthcare provider account
        </p>
      </div>
      <div className={styles.formGrid}>
        <div className={`${styles.sectionLabel} ${styles.colSpan2}`}>
          I am registering as&hellip;
        </div>
        <div className={styles.colSpan2}>
          <div className={styles.providerTypeGrid}>
            {PROVIDER_TYPES.map((pt) => (
              <label
                key={pt.value}
                className={`${styles.providerTypeCard} ${
                  data.providerType === pt.value
                    ? styles.providerTypeCardSelected
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="providerType"
                  value={pt.value}
                  checked={data.providerType === pt.value}
                  onChange={onChange}
                  className={styles.hiddenRadio}
                />
                <span className={styles.providerTypeIcon}>{pt.icon}</span>
                <span className={styles.providerTypeLabel}>{pt.label}</span>
                <span className={styles.providerTypeSub}>{pt.sub}</span>
                {data.providerType === pt.value && (
                  <span className={styles.providerTypeCheck}>
                    <Check size={11} />
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        <Field
          label={data.providerType === "doctor" ? "Full Name" : "Organisation Name"}
          error={errors.orgName}
          className={styles.colSpan2}
        >
          <Inp
            name="orgName"
            value={data.orgName}
            onChange={onChange}
            placeholder={
              data.providerType === "doctor"
                ? "Dr. Meera Sharma"
                : "e.g. City Diagnostics Centre"
            }
            hasError={!!errors.orgName}
          />
        </Field>

        {/* Email Address with OTP Verify */}
        <Field 
          label="Email Address" 
          error={errors.email}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Inp
              type="email"
              name="email"
              value={data.email}
              onChange={onChange}
              placeholder="contact@example.com"
              hasError={!!errors.email}
              disabled={emailVerified}
              style={{ flex: 1 }}
            />
            {emailVerified ? (
              <span className={styles.otpBadge}>
                <Check size={12} /> Verified
              </span>
            ) : (
              !emailOtpRequested && (
                <button
                  type="button"
                  onClick={() => onSendOtp("email")}
                  disabled={sendingEmailOtp || !data.email}
                  className={`${styles.otpBtn} ${styles.otpBtnSend}`}
                >
                  {sendingEmailOtp ? "Sending..." : "Verify"}
                </button>
              )
            )}
          </div>

          {!emailVerified && emailOtpRequested && (
            <div className={styles.otpRow}>
              <Inp
                type="text"
                placeholder="6-digit OTP"
                value={emailOtp}
                onChange={(e) => onOtpChange("email", e.target.value)}
                maxLength={6}
                className={styles.otpInput}
              />
              <button
                type="button"
                onClick={() => onVerifyOtp("email")}
                disabled={verifyingEmailOtp || emailOtp.length !== 6}
                className={`${styles.otpBtn} ${styles.otpBtnVerify}`}
              >
                {verifyingEmailOtp ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={() => onSendOtp("email")}
                disabled={sendingEmailOtp}
                className={`${styles.otpBtn} ${styles.otpBtnSend}`}
              >
                Resend
              </button>
            </div>
          )}

          {!emailVerified && devEmailOtp && (
            <div className={styles.otpDevBox}>
              <span>[Dev Mode] Generated OTP:</span>
              <strong className={styles.otpDevCode}>{devEmailOtp}</strong>
            </div>
          )}
        </Field>

        {/* Phone Number with OTP Verify */}
        <Field 
          label="Phone Number" 
          error={errors.phone}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Inp
              type="tel"
              name="phone"
              value={data.phone}
              onChange={onChange}
              placeholder="+91 98765 43210"
              hasError={!!errors.phone}
              disabled={phoneVerified}
              style={{ flex: 1 }}
            />
            {phoneVerified ? (
              <span className={styles.otpBadge}>
                <Check size={12} /> Verified
              </span>
            ) : (
              !phoneOtpRequested && (
                <button
                  type="button"
                  onClick={() => onSendOtp("phone")}
                  disabled={sendingPhoneOtp || !data.phone}
                  className={`${styles.otpBtn} ${styles.otpBtnSend}`}
                >
                  {sendingPhoneOtp ? "Sending..." : "Verify"}
                </button>
              )
            )}
          </div>

          {!phoneVerified && phoneOtpRequested && (
            <div className={styles.otpRow}>
              <Inp
                type="text"
                placeholder="6-digit OTP"
                value={phoneOtp}
                onChange={(e) => onOtpChange("phone", e.target.value)}
                maxLength={6}
                className={styles.otpInput}
              />
              <button
                type="button"
                onClick={() => onVerifyOtp("phone")}
                disabled={verifyingPhoneOtp || phoneOtp.length !== 6}
                className={`${styles.otpBtn} ${styles.otpBtnVerify}`}
              >
                {verifyingPhoneOtp ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={() => onSendOtp("phone")}
                disabled={sendingPhoneOtp}
                className={`${styles.otpBtn} ${styles.otpBtnSend}`}
              >
                Resend
              </button>
            </div>
          )}

          {!phoneVerified && devPhoneOtp && (
            <div className={styles.otpDevBox}>
              <span>[Dev Mode] Generated OTP:</span>
              <strong className={styles.otpDevCode}>{devPhoneOtp}</strong>
            </div>
          )}
        </Field>

        <div className={styles.colSpan2}>
          <PwdField
            label="Password"
            name="password"
            value={data.password}
            onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
            error={errors.password}
            show={showPass}
            onToggle={onTogglePass}
            hint="Minimum 8 characters"
          />
        </div>
        <div className={styles.colSpan2}>
          <PwdField
            label="Confirm Password"
            name="confirmPassword"
            value={data.confirmPassword}
            onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void}
            error={errors.confirmPassword}
            show={showConfirmPass}
            onToggle={onToggleConfirmPass}
          />
        </div>
      </div>
    </>
  );
}

// ─── Provider Step 2 — Professional Details (dynamic) ────────────────────────

function ProviderStep2({
  data,
  errors,
  onChange,
}: {
  data: ProviderData;
  errors: Record<string, string>;
  onChange: (e: ChangeEvent) => void;
}) {
  const isDoctor = data.providerType === "doctor";
  const isLab = data.providerType === "lab";

  return (
    <>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Professional Details</h2>
        <p className={styles.formSubtitle}>
          {isDoctor
            ? "Your medical credentials and practice information"
            : isLab
            ? "Your laboratory details and accreditation"
            : "Your facility details and services"}
        </p>
      </div>
      <div className={styles.formGrid}>
        {isDoctor && (
          <>
            <Field
              label="Specialisation"
              error={errors.specialisation}
              className={styles.colSpan2}
            >
              <Sel
                name="specialisation"
                value={data.specialisation}
                onChange={onChange}
                hasError={!!errors.specialisation}
              >
                <option value="">Select specialisation</option>
                {SPECIALISATIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Sel>
            </Field>
            <Field
              label="MCI / NMC Registration Number"
              error={errors.licenseNumber}
            >
              <Inp
                name="licenseNumber"
                value={data.licenseNumber}
                onChange={onChange}
                placeholder="e.g. MH-12345"
                hasError={!!errors.licenseNumber}
              />
            </Field>
            <Field label="Years of Experience" optional>
              <Inp
                type="number"
                name="experience"
                value={data.experience}
                onChange={onChange}
                placeholder="e.g. 10"
                min="0"
                max="60"
              />
            </Field>
            <Field
              label="Consultation Fee (₹)"
              optional
              hint="Per standard consultation"
            >
              <Inp
                type="number"
                name="consultationFee"
                value={data.consultationFee}
                onChange={onChange}
                placeholder="e.g. 500"
              />
            </Field>
            <Field label="Hospital / Clinic Affiliation" optional>
              <Inp
                name="affiliation"
                value={data.affiliation}
                onChange={onChange}
                placeholder="e.g. Apollo Hospitals, Bangalore"
              />
            </Field>
          </>
        )}

        {!isDoctor && !isLab && (
          <>
            <Field
              label="Facility Registration Number"
              error={errors.regNumber}
              className={styles.colSpan2}
            >
              <Inp
                name="regNumber"
                value={data.regNumber}
                onChange={onChange}
                placeholder="e.g. MH/CL/2020/12345"
                hasError={!!errors.regNumber}
              />
            </Field>
            <Field label="Facility Type" optional>
              <Sel
                name="facilityType"
                value={data.facilityType}
                onChange={onChange}
              >
                <option value="">Select type</option>
                <option value="general">General</option>
                <option value="multi-specialty">Multi-Specialty</option>
                <option value="super-specialty">Super-Specialty</option>
                <option value="maternity">Maternity &amp; Women&apos;s Health</option>
                <option value="children">Children&apos;s / Paediatric</option>
                <option value="dental">Dental Clinic</option>
                <option value="eye">Eye / Ophthalmology</option>
                <option value="other">Other</option>
              </Sel>
            </Field>
            <Field label="Number of Doctors" optional>
              <Inp
                type="number"
                name="doctorCount"
                value={data.doctorCount}
                onChange={onChange}
                placeholder="e.g. 15"
                min="1"
              />
            </Field>
            <Field
              label="Key Specialities Offered"
              optional
              hint="Comma-separated"
              className={styles.colSpan2}
            >
              <Txt
                name="specialities"
                value={data.specialities}
                onChange={onChange}
                placeholder="e.g. Cardiology, Orthopaedics, Neurology"
              />
            </Field>
          </>
        )}

        {isLab && (
          <>
            <Field
              label="Lab Registration Number"
              error={errors.regNumber}
              className={styles.colSpan2}
            >
              <Inp
                name="regNumber"
                value={data.regNumber}
                onChange={onChange}
                placeholder="e.g. MH/LAB/2020/12345"
                hasError={!!errors.regNumber}
              />
            </Field>
            <Field label="NABL Accreditation" optional>
              <Sel
                name="nablAccredited"
                value={data.nablAccredited}
                onChange={onChange}
              >
                <option value="yes">Yes — NABL Accredited</option>
                <option value="no">Not Currently</option>
                <option value="pending">Accreditation Pending</option>
              </Sel>
            </Field>
            <Field label="Years in Operation" optional>
              <Inp
                type="number"
                name="experience"
                value={data.experience}
                onChange={onChange}
                placeholder="e.g. 5"
                min="0"
              />
            </Field>
            <Field
              label="Key Tests / Services Offered"
              optional
              hint="Comma-separated"
              className={styles.colSpan2}
            >
              <Txt
                name="specialities"
                value={data.specialities}
                onChange={onChange}
                placeholder="e.g. CBC, Lipid Panel, MRI, CT Scan, Histopathology"
              />
            </Field>
          </>
        )}
      </div>
    </>
  );
}

// ─── Provider Step 3 — Location & Consent ─────────────────────────────────────

function ProviderStep3({
  data,
  errors,
  onChange,
}: {
  data: ProviderData;
  errors: Record<string, string>;
  onChange: (e: ChangeEvent) => void;
}) {
  return (
    <>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Location &amp; Consent</h2>
        <p className={styles.formSubtitle}>
          Your practice address and final agreement
        </p>
      </div>
      <div className={styles.formGrid}>
        <Field
          label="Street Address"
          error={errors.address}
          className={styles.colSpan2}
        >
          <Inp
            name="address"
            value={data.address}
            onChange={onChange}
            placeholder="Building name, street, locality"
            hasError={!!errors.address}
          />
        </Field>
        <Field label="City" error={errors.city}>
          <Inp
            name="city"
            value={data.city}
            onChange={onChange}
            placeholder="e.g. Mumbai"
            hasError={!!errors.city}
          />
        </Field>
        <Field label="State" error={errors.state}>
          <Sel
            name="state"
            value={data.state}
            onChange={onChange}
            hasError={!!errors.state}
          >
            <option value="">Select state</option>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Sel>
        </Field>
        <Field label="PIN Code" error={errors.pincode}>
          <Inp
            name="pincode"
            value={data.pincode}
            onChange={onChange}
            placeholder="e.g. 400001"
            maxLength={6}
            hasError={!!errors.pincode}
          />
        </Field>
        <Field label="Website" optional>
          <Inp
            type="url"
            name="website"
            value={data.website}
            onChange={onChange}
            placeholder="https://yourclinic.com"
          />
        </Field>

        <div className={`${styles.colSpan2} ${styles.termsRow}`}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="terms"
              checked={data.terms}
              onChange={onChange}
              className={styles.checkboxInput}
            />
            <span>
              I agree to MediCore&apos;s{" "}
              <a
                href="/terms"
                className={styles.termsLink}
                target="_blank"
                rel="noreferrer"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className={styles.termsLink}
                target="_blank"
                rel="noreferrer"
              >
                Privacy Policy
              </a>
              . I confirm all professional details are accurate and authorise
              MediCore to conduct credential verification.
            </span>
          </label>
          {errors.terms && (
            <span className={styles.formError}>{errors.terms}</span>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function SignupPage() {
  const [screen, setScreen] = useState<Screen>("role");
  const [role, setRole] = useState<Role>(null);
  const [step, setStep] = useState<Step>(1);
  const [patient, setPatient] = useState<PatientData>(initPatient);
  const [provider, setProvider] = useState<ProviderData>(initProvider);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [regId] = useState(
    () => `MC-${Math.random().toString(36).slice(2, 9).toUpperCase()}`
  );
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registeredId, setRegisteredId] = useState<string>("");

  // OTP states
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtpRequested, setEmailOtpRequested] = useState(false);
  const [phoneOtpRequested, setPhoneOtpRequested] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const [devEmailOtp, setDevEmailOtp] = useState("");
  const [devPhoneOtp, setDevPhoneOtp] = useState("");

  const handleRoleSelect = (r: "patient" | "provider") => {
    setRole(r);
    setStep(1);
    setErrors({});
    setShowPass(false);
    setShowConfirmPass(false);
    
    // Reset OTP verification states on role select
    setEmailVerified(false);
    setPhoneVerified(false);
    setEmailOtp("");
    setPhoneOtp("");
    setEmailOtpRequested(false);
    setPhoneOtpRequested(false);
    setDevEmailOtp("");
    setDevPhoneOtp("");

    setScreen("form");
  };

  const handlePatientChange = (e: ChangeEvent) => {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setPatient((prev) => ({ ...prev, [name]: val }));
    
    // Reset OTP states if value changed
    if (name === "email") {
      setEmailVerified(false);
      setEmailOtp("");
      setEmailOtpRequested(false);
      setDevEmailOtp("");
    } else if (name === "phone") {
      setPhoneVerified(false);
      setPhoneOtp("");
      setPhoneOtpRequested(false);
      setDevPhoneOtp("");
    }

    if (errors[name])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
  };

  const handleProviderChange = (e: ChangeEvent) => {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setProvider((prev) => ({ ...prev, [name]: val }));
    
    // Reset OTP states if value changed
    if (name === "email") {
      setEmailVerified(false);
      setEmailOtp("");
      setEmailOtpRequested(false);
      setDevEmailOtp("");
    } else if (name === "phone") {
      setPhoneVerified(false);
      setPhoneOtp("");
      setPhoneOtpRequested(false);
      setDevPhoneOtp("");
    }

    if (errors[name])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
  };

  const handleSendSignupOtp = async (type: "email" | "phone") => {
    const emailRe = /\S+@\S+\.\S+/;
    const value = role === "patient" ? patient[type] : provider[type];
    
    if (type === "email") {
      if (!value || !emailRe.test(value)) {
        setErrors((prev) => ({ ...prev, email: "Valid email is required to send OTP" }));
        return;
      }
      setSendingEmailOtp(true);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.email;
        return next;
      });
    } else {
      if (!value || value.replace(/\D/g, "").length < 10) {
        setErrors((prev) => ({ ...prev, phone: "Valid phone number is required to send OTP" }));
        return;
      }
      setSendingPhoneOtp(true);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    }

    try {
      const response = await apiClient.post("/auth/register/otp/request", {
        type,
        value,
      });
      
      if (type === "email") {
        setEmailOtpRequested(true);
        if (response.data?.otp) {
          setDevEmailOtp(response.data.otp);
        }
      } else {
        setPhoneOtpRequested(true);
        if (response.data?.otp) {
          setDevPhoneOtp(response.data.otp);
        }
      }
    } catch (err: any) {
      console.error(`Failed to send ${type} OTP:`, err);
      const errMsg = err.response?.data?.error || `Failed to send OTP. Please try again.`;
      setErrors((prev) => ({ ...prev, [type]: errMsg }));
    } finally {
      if (type === "email") {
        setSendingEmailOtp(false);
      } else {
        setSendingPhoneOtp(false);
      }
    }
  };

  const handleVerifySignupOtp = async (type: "email" | "phone") => {
    const value = role === "patient" ? patient[type] : provider[type];
    const otp = type === "email" ? emailOtp : phoneOtp;

    if (!otp || otp.length !== 6) {
      setErrors((prev) => ({ ...prev, [type]: "6-digit OTP is required" }));
      return;
    }

    if (type === "email") {
      setVerifyingEmailOtp(true);
    } else {
      setVerifyingPhoneOtp(true);
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });

    try {
      await apiClient.post("/auth/register/otp/verify", {
        type,
        value,
        otp,
      });

      if (type === "email") {
        setEmailVerified(true);
        setDevEmailOtp("");
      } else {
        setPhoneVerified(true);
        setDevPhoneOtp("");
      }
    } catch (err: any) {
      console.error(`Failed to verify ${type} OTP:`, err);
      const errMsg = err.response?.data?.error || `Invalid or expired OTP code`;
      setErrors((prev) => ({ ...prev, [type]: errMsg }));
    } finally {
      if (type === "email") {
        setVerifyingEmailOtp(false);
      } else {
        setVerifyingPhoneOtp(false);
      }
    }
  };

  const handleOtpChange = (type: "email" | "phone", value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (type === "email") {
      setEmailOtp(cleaned);
    } else {
      setPhoneOtp(cleaned);
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const emailRe = /\S+@\S+\.\S+/;

    if (role === "patient") {
      if (step === 1) {
        if (!patient.fullName.trim()) e.fullName = "Full name is required";
        if (!patient.email || !emailRe.test(patient.email))
          e.email = "Valid email is required";
        if (!patient.phone || patient.phone.replace(/\D/g, "").length < 10)
          e.phone = "Valid phone number is required";
        if (!patient.password || patient.password.length < 8)
          e.password = "Password must be at least 8 characters";
        if (patient.password !== patient.confirmPassword)
          e.confirmPassword = "Passwords do not match";
        if (!emailVerified) e.email = "Email must be OTP-verified first";
        if (!phoneVerified) e.phone = "Phone must be OTP-verified first";
      } else if (step === 2) {
        if (!patient.dob) e.dob = "Date of birth is required";
        if (!patient.gender) e.gender = "Please select a gender";
        if (!patient.bloodGroup) e.bloodGroup = "Please select a blood group";
      } else {
        if (!patient.emergencyName.trim())
          e.emergencyName = "Contact name is required";
        if (!patient.emergencyPhone.trim())
          e.emergencyPhone = "Contact phone is required";
        if (!patient.emergencyRelation)
          e.emergencyRelation = "Relationship is required";
        if (!patient.terms) e.terms = "You must accept the terms to continue";
      }
    }

    if (role === "provider") {
      if (step === 1) {
        if (!provider.orgName.trim()) e.orgName = "Name is required";
        if (!provider.email || !emailRe.test(provider.email))
          e.email = "Valid email is required";
        if (!provider.phone || provider.phone.replace(/\D/g, "").length < 10)
          e.phone = "Valid phone number is required";
        if (!provider.password || provider.password.length < 8)
          e.password = "Password must be at least 8 characters";
        if (provider.password !== provider.confirmPassword)
          e.confirmPassword = "Passwords do not match";
        if (!emailVerified) e.email = "Email must be OTP-verified first";
        if (!phoneVerified) e.phone = "Phone must be OTP-verified first";
      } else if (step === 2) {
        if (provider.providerType === "doctor") {
          if (!provider.specialisation)
            e.specialisation = "Specialisation is required";
          if (!provider.licenseNumber.trim())
            e.licenseNumber = "Registration number is required";
        } else {
          if (!provider.regNumber.trim())
            e.regNumber = "Registration number is required";
        }
      } else {
        if (!provider.address.trim()) e.address = "Address is required";
        if (!provider.city.trim()) e.city = "City is required";
        if (!provider.state) e.state = "Please select a state";
        if (!provider.pincode || provider.pincode.replace(/\D/g, "").length < 6)
          e.pincode = "Valid 6-digit PIN code is required";
        if (!provider.terms) e.terms = "You must accept the terms to continue";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
      setErrors({});
    } else {
      setLoading(true);
      setSubmitError(null);
      try {
        let payload: any = {};
        if (role === "patient") {
          payload = {
            role: "patient",
            fullName: patient.fullName,
            email: patient.email,
            phone: patient.phone,
            password: patient.password,
            dob: patient.dob,
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            height: patient.height,
            weight: patient.weight,
            allergies: patient.allergies,
            medications: patient.medications,
            emergencyName: patient.emergencyName,
            emergencyPhone: patient.emergencyPhone,
            emergencyRelation: patient.emergencyRelation,
            insuranceProvider: patient.insuranceProvider,
            policyNumber: patient.policyNumber,
            terms: patient.terms,
          };
        } else if (role === "provider") {
          if (provider.providerType !== "doctor") {
            setSubmitError("Individual doctor registrations are supported for Phase 1 testing. Clinics/Hospitals/Labs are coming soon.");
            setLoading(false);
            return;
          }
          payload = {
            role: "provider",
            fullName: provider.orgName,
            email: provider.email,
            phone: provider.phone,
            password: provider.password,
            specialisation: provider.specialisation,
            licenseNumber: provider.licenseNumber,
            experience: provider.experience,
            consultationFee: provider.consultationFee,
            affiliation: provider.affiliation,
            terms: provider.terms,
          };
        }

        const response = await apiClient.post("/auth/register", payload);
        const responseData = response.data?.data;
        if (responseData) {
          useAuthStore.getState().setAccessToken(responseData.accessToken);
          useAuthStore.getState().setUser(responseData.user);
          setRegisteredId(responseData.user.id);
        }
        setScreen("success");
      } catch (err: any) {
        console.error("Signup failed:", err);
        const details = err.response?.data?.details;
        if (details) {
          const serverErrors: Record<string, string> = {};
          const messages: string[] = [];
          Object.entries(details).forEach(([key, value]: any) => {
            const msg = Array.isArray(value) ? value[0] : value;
            serverErrors[key] = msg;
            messages.push(`${key}: ${msg}`);
          });
          setErrors(serverErrors);
          setSubmitError(`Please fix the following: ${messages.join(", ")}`);
        } else {
          const errMsg = err.response?.data?.error || err.message || "Something went wrong. Please try again.";
          setSubmitError(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
      setErrors({});
    } else {
      setScreen("role");
      setRole(null);
      setErrors({});
    }
  };

  const patientLabels = ["Account", "Health Profile", "Emergency & Consent"];
  const providerLabels = ["Account", "Professional Details", "Location & Consent"];
  const stepLabels = role === "patient" ? patientLabels : providerLabels;

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
        {/* ── ROLE PICKER ──────────────────────────────────────────── */}
        {screen === "role" && (
          <div className={styles.roleScreen}>
            <div className={styles.roleHeader}>
              <span className="badge-green">Create Account</span>
              <h1 className={styles.roleTitle}>Welcome to MediCore</h1>
              <p className={styles.roleSub}>I am signing up as&hellip;</p>
            </div>

            <div className={styles.roleCards}>
              {/* Patient card */}
              <button
                className={styles.roleCard}
                onClick={() => handleRoleSelect("patient")}
              >
                <div className={`${styles.roleCardIcon} ${styles.iconPatient}`}>
                  <User size={32} />
                </div>
                <div className={styles.roleCardBody}>
                  <h2 className={styles.roleCardTitle}>Patient</h2>
                  <p className={styles.roleCardDesc}>
                    Centralise your medical records, get AI-powered health
                    insights, and consult verified doctors — all in one secure
                    vault.
                  </p>
                  <ul className={styles.featureList}>
                    <li>
                      <Check size={12} /> Upload &amp; manage all medical records
                    </li>
                    <li>
                      <Check size={12} /> AI health chatbot &amp; biomarker analytics
                    </li>
                    <li>
                      <Check size={12} /> Book video consultations with doctors
                    </li>
                    <li>
                      <Check size={12} /> Privacy-first consent control
                    </li>
                  </ul>
                </div>
                <div className={styles.roleCardCta}>
                  Sign up as Patient <ArrowRight size={14} />
                </div>
              </button>

              {/* Provider card */}
              <button
                className={styles.roleCard}
                onClick={() => handleRoleSelect("provider")}
              >
                <div className={`${styles.roleCardIcon} ${styles.iconProvider}`}>
                  <Stethoscope size={32} />
                </div>
                <div className={styles.roleCardBody}>
                  <h2 className={styles.roleCardTitle}>
                    Doctor / Clinic / Hospital
                  </h2>
                  <p className={styles.roleCardDesc}>
                    Access AI-generated patient briefs, manage appointments,
                    upload prescriptions, and deliver care through a unified
                    provider portal.
                  </p>
                  <ul className={styles.featureList}>
                    <li>
                      <Check size={12} /> AI patient summary briefs before consults
                    </li>
                    <li>
                      <Check size={12} /> Digital prescriptions &amp; record management
                    </li>
                    <li>
                      <Check size={12} /> Appointment scheduling &amp; availability
                    </li>
                    <li>
                      <Check size={12} /> Video consultation suite
                    </li>
                  </ul>
                </div>
                <div className={styles.roleCardCta}>
                  Sign up as Provider <ArrowRight size={14} />
                </div>
              </button>
            </div>

            <p className={styles.loginPrompt}>
              Already have an account?{" "}
              <Link href="/login" className={styles.loginLink}>
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* ── MULTI-STEP FORM ───────────────────────────────────────── */}
        {screen === "form" && (
          <div className={styles.formScreen}>
            {/* Progress */}
            <div className={styles.progressWrap}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
              <div className={styles.stepIndicators}>
                {([1, 2, 3] as Step[]).map((s) => (
                  <div
                    key={s}
                    className={`${styles.stepDot} ${
                      step === s ? styles.stepDotActive : ""
                    } ${step > s ? styles.stepDotDone : ""}`}
                  >
                    <span className={styles.stepNum}>
                      {step > s ? <Check size={14} /> : s}
                    </span>
                    <span className={styles.stepLabel}>{stepLabels[s - 1]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form card */}
            <div className={styles.formCard}>
              {role === "patient" && step === 1 && (
                <PatientStep1
                  data={patient}
                  errors={errors}
                  onChange={handlePatientChange}
                  showPass={showPass}
                  showConfirmPass={showConfirmPass}
                  onTogglePass={() => setShowPass((p) => !p)}
                  onToggleConfirmPass={() => setShowConfirmPass((p) => !p)}
                  emailVerified={emailVerified}
                  phoneVerified={phoneVerified}
                  emailOtp={emailOtp}
                  phoneOtp={phoneOtp}
                  emailOtpRequested={emailOtpRequested}
                  phoneOtpRequested={phoneOtpRequested}
                  sendingEmailOtp={sendingEmailOtp}
                  sendingPhoneOtp={sendingPhoneOtp}
                  verifyingEmailOtp={verifyingEmailOtp}
                  verifyingPhoneOtp={verifyingPhoneOtp}
                  devEmailOtp={devEmailOtp}
                  devPhoneOtp={devPhoneOtp}
                  onSendOtp={handleSendSignupOtp}
                  onVerifyOtp={handleVerifySignupOtp}
                  onOtpChange={handleOtpChange}
                />
              )}
              {role === "patient" && step === 2 && (
                <PatientStep2
                  data={patient}
                  errors={errors}
                  onChange={handlePatientChange}
                />
              )}
              {role === "patient" && step === 3 && (
                <PatientStep3
                  data={patient}
                  errors={errors}
                  onChange={handlePatientChange}
                />
              )}
              {role === "provider" && step === 1 && (
                <ProviderStep1
                  data={provider}
                  errors={errors}
                  onChange={handleProviderChange}
                  showPass={showPass}
                  showConfirmPass={showConfirmPass}
                  onTogglePass={() => setShowPass((p) => !p)}
                  onToggleConfirmPass={() => setShowConfirmPass((p) => !p)}
                  emailVerified={emailVerified}
                  phoneVerified={phoneVerified}
                  emailOtp={emailOtp}
                  phoneOtp={phoneOtp}
                  emailOtpRequested={emailOtpRequested}
                  phoneOtpRequested={phoneOtpRequested}
                  sendingEmailOtp={sendingEmailOtp}
                  sendingPhoneOtp={sendingPhoneOtp}
                  verifyingEmailOtp={verifyingEmailOtp}
                  verifyingPhoneOtp={verifyingPhoneOtp}
                  devEmailOtp={devEmailOtp}
                  devPhoneOtp={devPhoneOtp}
                  onSendOtp={handleSendSignupOtp}
                  onVerifyOtp={handleVerifySignupOtp}
                  onOtpChange={handleOtpChange}
                />
              )}
              {role === "provider" && step === 2 && (
                <ProviderStep2
                  data={provider}
                  errors={errors}
                  onChange={handleProviderChange}
                />
              )}
              {role === "provider" && step === 3 && (
                <ProviderStep3
                  data={provider}
                  errors={errors}
                  onChange={handleProviderChange}
                />
              )}

              {submitError && (
                <div style={{ color: "#d35400", backgroundColor: "#fcf2eb", padding: 12, borderRadius: 8, fontSize: "0.9rem", marginBottom: 16, border: "1px solid rgba(211, 84, 0, 0.15)" }}>
                  {submitError}
                </div>
              )}

              {/* Navigation */}
              <div className={styles.formNav}>
                <button
                  className="btn-secondary"
                  onClick={handleBack}
                  disabled={loading}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <ArrowLeft size={14} />
                  {step === 1 ? "Change Role" : "Back"}
                </button>
                <button
                  className="btn-primary"
                  onClick={handleNext}
                  disabled={loading}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {loading ? "Registering..." : (step === 3 ? "Create Account" : "Continue")}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <p className={styles.loginPrompt}>
              Already have an account?{" "}
              <Link href="/login" className={styles.loginLink}>
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* ── SUCCESS ──────────────────────────────────────────────── */}
        {screen === "success" && (
          <div className={styles.successScreen}>
            <div className={styles.successCard}>
              <div className={styles.successIconWrap}>
                <CheckCircle size={52} strokeWidth={1.5} />
              </div>
              <h2 className={styles.successTitle}>
                {role === "patient"
                  ? `Welcome, ${patient.fullName.split(" ")[0] || "there"}!`
                  : `Welcome aboard!`}
              </h2>
              <p className={styles.successDesc}>
                {role === "patient"
                  ? "Your MediCore patient account is ready. Start by uploading your first medical record — our AI will summarise it instantly."
                  : "Your provider account is under review. We'll notify you within 24–48 hours once credential verification is complete."}
              </p>
              <div className={styles.successIdBox}>
                <span>Account ID</span>
                <strong>{registeredId || regId}</strong>
              </div>
              <div className={styles.successActions}>
                <Link
                  href={role === "patient" ? "/patient/dashboard" : "/doctor/dashboard"}
                  className="btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  Go to Dashboard <ArrowRight size={15} />
                </Link>
                <Link href="/" className="btn-secondary">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
