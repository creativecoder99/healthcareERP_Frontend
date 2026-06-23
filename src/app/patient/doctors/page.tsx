"use client";

import React, { useEffect, useState } from "react";
import {
  Stethoscope,
  UserPlus,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  AlertCircle,
  Mail,
} from "lucide-react";
import { apiClient } from "../../../lib/api-client";

interface Link {
  id: string;
  status: string;
  initiatedBy: string;
  requestedAt: string;
  respondedAt: string | null;
  doctor: {
    id: string;
    fullName: string;
    specialisation: string | null;
    licenceVerified: boolean;
    avatarUrl: string | null;
    consultationFee: number | null;
    user: { email: string };
  };
}

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "#618764",
  PENDING: "#d97706",
  DENIED: "#dc2626",
  REVOKED: "#6b7280",
};

export default function PatientDoctorsPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const fetchLinks = async () => {
    try {
      const res = await apiClient.get("/links");
      if (res.data?.success) setLinks(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id + "_approve");
    try {
      await apiClient.post(`/links/${id}/approve`);
      await fetchLinks();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (id: string) => {
    setActionLoading(id + "_deny");
    try {
      await apiClient.post(`/links/${id}/deny`);
      await fetchLinks();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this doctor's access to your records?")) return;
    setActionLoading(id + "_revoke");
    try {
      await apiClient.delete(`/links/${id}`);
      await fetchLinks();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      const res = await apiClient.post("/patient/doctors/invite", { doctorEmail: inviteEmail.trim() });
      if (res.data?.success) {
        setInviteSuccess("Doctor added successfully.");
        setInviteEmail("");
        await fetchLinks();
      }
    } catch (err: any) {
      setInviteError(err?.response?.data?.message || "Failed to invite doctor.");
    } finally {
      setInviteLoading(false);
    }
  };

  const pending = links.filter((l) => l.status === "PENDING");
  const approved = links.filter((l) => l.status === "APPROVED");
  const others = links.filter((l) => l.status !== "PENDING" && l.status !== "APPROVED");

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, border: "3px solid #f3e8e2", borderTop: "3px solid #d35400", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: "0.85rem", color: "#618764" }}>Loading doctors...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Invite card */}
      <div style={{ background: "#fff", border: "1px solid #eef1ec", borderRadius: 14, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#d35400", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserPlus size={17} color="#fff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "#273338" }}>Add a Doctor</h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#618764" }}>Enter the doctor's registered email to grant them access to your records.</p>
          </div>
        </div>
        <form onSubmit={handleInvite} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240, display: "flex", alignItems: "center", gap: 8, background: "#fafbfa", border: "1px solid #9CB080", borderRadius: 8, padding: "0 12px" }}>
            <Mail size={15} color="#618764" />
            <input
              type="email"
              placeholder="doctor@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              style={{ flex: 1, border: "none", background: "transparent", padding: "11px 0", fontSize: "0.9rem", color: "#273338", outline: "none" }}
            />
          </div>
          <button
            type="submit"
            disabled={inviteLoading}
            style={{ padding: "0 22px", height: 44, background: "#d35400", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", opacity: inviteLoading ? 0.7 : 1 }}
          >
            {inviteLoading ? "Adding..." : "Add Doctor"}
          </button>
        </form>
        {inviteError && <p style={{ marginTop: 10, fontSize: "0.82rem", color: "#dc2626" }}>{inviteError}</p>}
        {inviteSuccess && <p style={{ marginTop: 10, fontSize: "0.82rem", color: "#618764" }}>{inviteSuccess}</p>}
      </div>

      {/* Pending requests needing action */}
      {pending.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #eef1ec", borderRadius: 14, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <AlertCircle size={17} color="#d97706" />
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "#273338" }}>Pending Requests ({pending.length})</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pending.map((link) => (
              <div key={link.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#eef1ec", border: "1px solid #9CB080", borderRadius: 10, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #d35400, #f39c12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                    {link.doctor.fullName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "#273338", fontSize: "0.95rem" }}>Dr. {link.doctor.fullName}</div>
                    <div style={{ fontSize: "0.78rem", color: "#618764" }}>{link.doctor.specialisation || "General Practice"} · {link.doctor.user.email}</div>
                    <div style={{ fontSize: "0.75rem", color: "#618764", marginTop: 2 }}>Requested {formatDate(link.requestedAt)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => handleApprove(link.id)}
                    disabled={actionLoading === link.id + "_approve"}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#618764", color: "#fff", border: "none", borderRadius: 7, fontWeight: 600, fontSize: "0.84rem", cursor: "pointer", opacity: actionLoading === link.id + "_approve" ? 0.7 : 1 }}
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleDeny(link.id)}
                    disabled={actionLoading === link.id + "_deny"}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#fff", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 7, fontWeight: 600, fontSize: "0.84rem", cursor: "pointer" }}
                  >
                    <XCircle size={14} /> Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved linked doctors */}
      <div style={{ background: "#fff", border: "1px solid #eef1ec", borderRadius: 14, padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <Stethoscope size={17} color="#d35400" />
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "#273338" }}>My Doctors ({approved.length})</h3>
        </div>
        {approved.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "32px 0", color: "#618764" }}>
            <Stethoscope size={36} color="#e8d8cc" />
            <p style={{ margin: 0, fontSize: "0.9rem" }}>No linked doctors yet. Add one above.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {approved.map((link) => (
              <div key={link.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#fafbfa", border: "1px solid #eef1ec", borderRadius: 10, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #d35400, #f39c12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1rem" }}>
                    {link.doctor.fullName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, color: "#273338", fontSize: "0.95rem" }}>Dr. {link.doctor.fullName}</span>
                      {link.doctor.licenceVerified && (
                        <span style={{ fontSize: "0.7rem", background: "#eef1ec", color: "#618764", padding: "1px 7px", borderRadius: 99, fontWeight: 600 }}>Verified</span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#618764" }}>{link.doctor.specialisation || "General Practice"} · {link.doctor.user.email}</div>
                    <div style={{ fontSize: "0.75rem", color: "#618764", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={11} /> Linked since {formatDate(link.respondedAt)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(link.id)}
                  disabled={actionLoading === link.id + "_revoke"}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 7, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}
                >
                  <Trash2 size={13} /> Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History (denied / revoked) */}
      {others.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #eef1ec", borderRadius: 14, padding: 28 }}>
          <h3 style={{ margin: "0 0 16px", fontWeight: 700, fontSize: "1rem", color: "#273338" }}>Access History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {others.map((link) => (
              <div key={link.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fafafa", borderRadius: 8, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 600, color: "#5c534c", fontSize: "0.9rem" }}>Dr. {link.doctor.fullName}</span>
                  <span style={{ marginLeft: 8, fontSize: "0.75rem", color: "#618764" }}>{link.doctor.user.email}</span>
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: STATUS_COLORS[link.status] ?? "#6b7280", background: "#f3f4f6", padding: "2px 10px", borderRadius: 99 }}>
                  {link.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
