"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Clock, FileText } from "lucide-react";
import { apiClient } from "../../../lib/api-client";

interface PatientRow {
  linkId: string;
  accessScope: string;
  linkedSince: string | null;
  patient: {
    id: string;
    fullName: string;
    email: string;
    dateOfBirth: string | null;
    gender: string | null;
    bloodGroup: string | null;
    avatarUrl: string | null;
    lastUpload: string | null;
  };
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiClient.get("/doctor/patients").then((res) => {
      if (res.data?.success) setPatients(res.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const filtered = patients.filter(
    (p) =>
      p.patient.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.patient.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, border: "3px solid #eef1ec", borderTop: "3px solid #618764", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Loading patients...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Search bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #eef1ec", borderRadius: 10, padding: "0 16px", height: 46 }}>
        <Search size={17} color="#618764" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, border: "none", background: "transparent", fontSize: "0.9rem", color: "#273338", outline: "none" }}
        />
        {filtered.length > 0 && (
          <span style={{ fontSize: "0.78rem", color: "#618764", fontWeight: 600 }}>{filtered.length} patient{filtered.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Patient list */}
      {filtered.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "60px 0", color: "#618764" }}>
          <Search size={36} color="#9CB080" />
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            {patients.length === 0 ? "No linked patients yet." : "No patients match your search."}
          </p>
          {patients.length === 0 && (
            <Link href="/doctor/dashboard" style={{ fontSize: "0.85rem", color: "#618764", textDecoration: "none", fontWeight: 600 }}>
              Request patient access from the dashboard →
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((row) => (
            <Link
              key={row.linkId}
              href={`/doctor/patients/${row.patient.id}`}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #eef1ec", borderRadius: 12, padding: "16px 20px", textDecoration: "none", flexWrap: "wrap", gap: 14 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, #618764, #9CB080)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 }}>
                  {row.patient.fullName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "#273338", fontSize: "0.95rem" }}>{row.patient.fullName}</div>
                  <div style={{ fontSize: "0.78rem", color: "#618764", marginTop: 2 }}>{row.patient.email}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                    {row.patient.gender && (
                      <span style={{ fontSize: "0.73rem", color: "#8c8075" }}>{row.patient.gender}</span>
                    )}
                    {row.patient.bloodGroup && (
                      <span style={{ fontSize: "0.73rem", background: "#fef3c7", color: "#d97706", padding: "1px 7px", borderRadius: 99, fontWeight: 600 }}>{row.patient.bloodGroup}</span>
                    )}
                    {row.patient.dateOfBirth && (
                      <span style={{ fontSize: "0.73rem", color: "#8c8075" }}>
                        DOB: {formatDate(row.patient.dateOfBirth)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: "#618764" }}>
                    <Clock size={11} /> Since {formatDate(row.linkedSince)}
                  </div>
                  {row.patient.lastUpload && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.73rem", color: "#618764", marginTop: 2 }}>
                      <FileText size={11} /> Last upload {formatDate(row.patient.lastUpload)}
                    </div>
                  )}
                  {row.accessScope === "SELECTED" && (
                    <span style={{ fontSize: "0.7rem", background: "#fef3c7", color: "#d97706", padding: "1px 7px", borderRadius: 99, fontWeight: 600, marginTop: 4, display: "inline-block" }}>Scoped Access</span>
                  )}
                </div>
                <ArrowRight size={16} color="#618764" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
