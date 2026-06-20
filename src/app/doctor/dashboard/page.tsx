"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  ArrowRight,
  Stethoscope,
} from "lucide-react";
import { useAuthStore } from "../../../lib/auth-store";
import { apiClient } from "../../../lib/api-client";

interface Link_ {
  id: string;
  status: string;
  requestedAt: string;
  patient: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    user: { email: string };
  };
}

interface DoctorProfile {
  fullName: string;
  specialisation: string | null;
  licenceVerified: boolean;
}

export default function DoctorDashboard() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [links, setLinks] = useState<Link_[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestEmail, setRequestEmail] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMsg, setRequestMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [profileRes, linksRes] = await Promise.all([
        apiClient.get("/doctor/profile"),
        apiClient.get("/links"),
      ]);
      if (profileRes.data?.success) setProfile(profileRes.data.data);
      if (linksRes.data?.success) setLinks(linksRes.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail.trim()) return;
    setRequestMsg(null);
    setRequestLoading(true);
    try {
      await apiClient.post("/doctor/patients/request-access", { patientEmail: requestEmail.trim() });
      setRequestMsg({ type: "ok", text: "Access request sent. The patient will be notified." });
      setRequestEmail("");
      await fetchData();
    } catch (err: any) {
      setRequestMsg({ type: "err", text: err?.response?.data?.message || "Failed to send request." });
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, border: "3px solid #dcfce7", borderTop: "3px solid #16a34a", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const currentHour = new Date().getHours();
  let greeting = "Good morning";
  if (currentHour >= 12 && currentHour < 17) greeting = "Good afternoon";
  else if (currentHour >= 17) greeting = "Good evening";

  const doctorName = profile?.fullName || user?.doctor?.fullName || "Doctor";
  const firstName = doctorName.split(" ")[0];

  const approved = links.filter((l) => l.status === "APPROVED");
  const pending = links.filter((l) => l.status === "PENDING");
  const denied = links.filter((l) => l.status === "DENIED" || l.status === "REVOKED");

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Welcome card */}
      <div style={{ background: "linear-gradient(135deg, #1a1e1a 0%, #16a34a 100%)", borderRadius: 14, padding: "28px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <h2 style={{ margin: "0 0 6px", fontSize: "1.45rem", fontWeight: 800, color: "#fff" }}>
          {greeting}, Dr. {firstName}!
        </h2>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>
          {profile?.specialisation || "General Practice"} · {profile?.licenceVerified ? "Licence Verified" : "Pending Verification"}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        {[
          { label: "Linked Patients", val: approved.length, color: "#16a34a", icon: <Users size={20} /> },
          { label: "Pending Requests", val: pending.length, color: "#d97706", icon: <Clock size={20} /> },
          { label: "Denied / Revoked", val: denied.length, color: "#6b7280", icon: <XCircle size={20} /> },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #f0e8e0", borderRadius: 12, padding: "20px 22px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2c2520", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: "0.78rem", color: "#a08060", marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Request access form */}
        <div style={{ background: "#fff", border: "1px solid #f0e8e0", borderRadius: 14, padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Stethoscope size={16} color="#16a34a" />
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "#2c2520" }}>Request Patient Access</h3>
          </div>
          <form onSubmit={handleRequestAccess} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fcfaf7", border: "1px solid #e8ddd4", borderRadius: 8, padding: "0 12px" }}>
              <Mail size={14} color="#a08060" />
              <input
                type="email"
                placeholder="patient@email.com"
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                style={{ flex: 1, border: "none", background: "transparent", padding: "11px 0", fontSize: "0.88rem", color: "#2c2520", outline: "none" }}
              />
            </div>
            <button
              type="submit"
              disabled={requestLoading}
              style={{ padding: "11px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", opacity: requestLoading ? 0.7 : 1 }}
            >
              {requestLoading ? "Sending..." : "Send Access Request"}
            </button>
          </form>
          {requestMsg && (
            <p style={{ marginTop: 10, fontSize: "0.82rem", color: requestMsg.type === "ok" ? "#16a34a" : "#dc2626" }}>
              {requestMsg.text}
            </p>
          )}
        </div>

        {/* Pending requests */}
        <div style={{ background: "#fff", border: "1px solid #f0e8e0", borderRadius: 14, padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={16} color="#d97706" />
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "#2c2520" }}>Pending ({pending.length})</h3>
            </div>
          </div>
          {pending.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#a08060", margin: 0 }}>No pending requests. Send one using the form.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pending.slice(0, 4).map((link) => (
                <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#fffbf5", border: "1px solid #fde8c8", borderRadius: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #d35400, #f39c12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>
                    {link.patient.fullName.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#2c2520", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.patient.fullName}</div>
                    <div style={{ fontSize: "0.73rem", color: "#a08060" }}>Requested {formatDate(link.requestedAt)}</div>
                  </div>
                  <Clock size={14} color="#d97706" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Linked patients preview */}
      <div style={{ background: "#fff", border: "1px solid #f0e8e0", borderRadius: 14, padding: 26 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={16} color="#16a34a" />
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "#2c2520" }}>Linked Patients</h3>
          </div>
          {approved.length > 0 && (
            <Link href="/doctor/patients" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.82rem", color: "#16a34a", textDecoration: "none", fontWeight: 600 }}>
              View All <ArrowRight size={13} />
            </Link>
          )}
        </div>
        {approved.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "24px 0", color: "#a08060" }}>
            <Users size={32} color="#e8f5e9" />
            <p style={{ margin: 0, fontSize: "0.88rem" }}>No approved patients yet. Request access above.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {approved.slice(0, 6).map((link) => (
              <Link key={link.id} href={`/doctor/patients/${link.patient.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#fcfaf7", border: "1px solid #f0e8e0", borderRadius: 10, textDecoration: "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #16a34a, #4ade80)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 }}>
                  {link.patient.fullName.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "#2c2520", fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.patient.fullName}</div>
                  <div style={{ fontSize: "0.72rem", color: "#a08060", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link.patient.user.email}</div>
                </div>
                <ArrowRight size={13} color="#a08060" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
