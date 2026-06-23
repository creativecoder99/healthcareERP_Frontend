"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Database,
  ShieldCheck,
  Plus,
  ArrowRight,
  FolderOpen,
  User,
  Sparkles,
  ExternalLink,
  Stethoscope,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { useAuthStore } from "../../../lib/auth-store";
import { apiClient } from "../../../lib/api-client";
import styles from "./dashboard.module.css";

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalSizeMB, setTotalSizeMB] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState<any>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const profileRes = await apiClient.get("/patient/profile");
        if (profileRes.data?.success) setProfile(profileRes.data.data);

        const recordsRes = await apiClient.get("/records?limit=3");
        if (recordsRes.data?.success) {
          setRecentRecords(recordsRes.data.data.records);
          setTotalRecords(recordsRes.data.data.pagination.total);
        }

        const allRecordsRes = await apiClient.get("/records?limit=100");
        if (allRecordsRes.data?.success) {
          const list = allRecordsRes.data.data.records;
          const bytes = list.reduce((acc: number, r: any) => acc + r.fileSize, 0);
          setTotalSizeMB(parseFloat((bytes / (1024 * 1024)).toFixed(2)));
        }

        const scoreRes = await apiClient.get("/analytics/health-score");
        if (scoreRes.data?.success) setHealthScore(scoreRes.data.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", width: "100%", height: "50vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, border: "3px solid #eef1ec", borderTop: "3px solid #618764", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 500 }}>Loading your health vault…</span>
        </div>
      </div>
    );
  }

  const currentHour = new Date().getHours();
  let greeting = "Good morning";
  if (currentHour >= 12 && currentHour < 17) greeting = "Good afternoon";
  else if (currentHour >= 17) greeting = "Good evening";

  const patientName = profile?.fullName || user?.patient?.fullName || "there";
  const firstName = patientName.split(" ")[0];
  const quotaPercent = Math.min((totalSizeMB / 100) * 100, 100);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className={styles.dashboard}>

      {/* Welcome Card */}
      <div className={styles.welcomeCard}>
        <div className={styles.welcomePattern} />
        <h2 className={styles.welcomeTitle}>{greeting}, {firstName}!</h2>
        <p className={styles.welcomeSub}>
          Your health vault is secure and ready. Upload new reports, review your medical history,
          or manage your trusted physicians — all in one place.
        </p>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconIndigo}`}>
            <FileText size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statVal}>{totalRecords}</span>
            <span className={styles.statLabel}>Health Documents</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconViolet}`}>
            <Database size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statVal}>
              {totalSizeMB} MB
              <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500, marginLeft: 4 }}>/ 100 MB</span>
            </span>
            <span className={styles.statLabel}>Vault Storage</span>
            <div className={styles.quotaBar}>
              <div className={styles.quotaFill} style={{ width: `${quotaPercent}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconEmerald}`}>
            <ShieldCheck size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statVal}>AES-256</span>
            <span className={styles.statLabel}>Encryption Active</span>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className={styles.grid}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Quick Actions */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Quick Actions</h3>
            <div className={styles.actionsGrid}>
              <Link href="/patient/records" className={styles.actionCard}>
                <div className={styles.actionIcon}><Plus size={18} /></div>
                <h4 className={styles.actionName}>Upload Document</h4>
                <p className={styles.actionDesc}>Add lab results, MRI scans, prescriptions, or discharge summaries.</p>
              </Link>
              <Link href="/patient/doctors" className={styles.actionCard}>
                <div className={styles.actionIcon}><Stethoscope size={18} /></div>
                <h4 className={styles.actionName}>My Doctors</h4>
                <p className={styles.actionDesc}>Manage physicians authorised to view your medical records.</p>
              </Link>
              <Link href="/patient/profile" className={styles.actionCard}>
                <div className={styles.actionIcon}><User size={18} /></div>
                <h4 className={styles.actionName}>Health Profile</h4>
                <p className={styles.actionDesc}>Update allergies, vitals, blood group, and emergency contacts.</p>
              </Link>
            </div>
          </div>

          {/* Recent Records */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <span>Recent Health Records</span>
              {totalRecords > 0 && (
                <Link href="/patient/records" className={styles.titleLink}>
                  View Vault <ArrowRight size={13} />
                </Link>
              )}
            </div>
            <div className={styles.recordsList}>
              {recentRecords.length === 0 ? (
                <div className={styles.emptyState}>
                  <FolderOpen size={32} color="#9CB080" />
                  <span className={styles.emptyStateText}>No documents yet — your vault is empty.</span>
                  <Link href="/patient/records" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "linear-gradient(135deg, #618764, #2B5748)", color: "#fff", borderRadius: 9, fontSize: "0.83rem", fontWeight: 700, textDecoration: "none" }}>
                    <Plus size={13} /> Upload First File
                  </Link>
                </div>
              ) : (
                recentRecords.map((rec) => (
                  <div key={rec.id} className={styles.recordItem}>
                    <div className={styles.recordMeta}>
                      <div className={styles.recordDocIcon}><FileText size={17} /></div>
                      <div className={styles.recordDetails}>
                        <span className={styles.recordName}>{rec.fileName}</span>
                        <div className={styles.recordSub}>
                          <span>{formatDate(rec.recordDate)}</span>
                          <span>·</span>
                          <span className={styles.recordTypeBadge}>{rec.recordType}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span className={`${styles.recordStatus} ${rec.processingStatus === "PENDING" ? styles.statusPending : styles.statusCompleted}`}>
                        {rec.processingStatus}
                      </span>
                      <Link href={`/patient/records?open=${rec.id}`} className={styles.recordActionLink}>
                        View <ExternalLink size={11} />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Profile Summary */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Health Profile</h3>
            <div className={styles.profileSummary}>
              <div className={styles.profileAvatarBox}>
                <div className={styles.profileAvatar}>{patientName.charAt(0)}</div>
                <h4 className={styles.profileName}>{patientName}</h4>
              </div>

              <div className={styles.vitalsRow}>
                <div className={styles.vitalBox}>
                  <span className={styles.vitalVal}>{profile?.heightCm ? `${profile.heightCm} cm` : "—"}</span>
                  <span className={styles.vitalLabel}>Height</span>
                </div>
                <div className={styles.vitalBox}>
                  <span className={styles.vitalVal}>{profile?.weightKg ? `${profile.weightKg} kg` : "—"}</span>
                  <span className={styles.vitalLabel}>Weight</span>
                </div>
              </div>

              <div className={styles.profileDetailsList}>
                <div className={styles.profileDetailItem}>
                  <span className={styles.detailLabel}>Blood Group</span>
                  <span className={styles.detailVal}>{profile?.bloodGroup || "Not set"}</span>
                </div>
                <div className={styles.profileDetailItem}>
                  <span className={styles.detailLabel}>Date of Birth</span>
                  <span className={styles.detailVal}>{formatDate(profile?.dateOfBirth)}</span>
                </div>
                <div className={styles.profileDetailItem}>
                  <span className={styles.detailLabel}>Allergies</span>
                  <span className={styles.detailVal}>
                    {profile?.allergies?.length > 0 ? profile.allergies.join(", ") : "None"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Health Score Widget */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <span>Health Score</span>
              <Link href="/patient/analytics" className={styles.titleLink}>
                View Analytics <ArrowRight size={13} />
              </Link>
            </div>
            {healthScore?.score != null ? (
              <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 20px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: healthScore.score >= 85 ? "#eef1ec" : healthScore.score >= 70 ? "#eef1ec" : healthScore.score >= 50 ? "#fff7ed" : "#fee2e2", flexShrink: 0 }}>
                  <span style={{ fontSize: "1.4rem", fontWeight: 800, color: healthScore.score >= 85 ? "#618764" : healthScore.score >= 70 ? "#618764" : healthScore.score >= 50 ? "#f97316" : "#ef4444" }}>
                    {healthScore.score}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>{healthScore.grade}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.78rem", fontWeight: 600, color: healthScore.trend === "improving" ? "#618764" : healthScore.trend === "declining" ? "#ef4444" : "#94a3b8" }}>
                      {healthScore.trend === "improving" ? <TrendingUp size={13} /> : healthScore.trend === "declining" ? <TrendingDown size={13} /> : <Minus size={13} />}
                      {healthScore.trend}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 4 }}>
                    {healthScore.normalCount} normal · {healthScore.abnormalCount} flagged out of {healthScore.trackedCount} values
                  </div>
                </div>
                <Activity size={18} color="#94a3b8" />
              </div>
            ) : (
              <div style={{ padding: "16px 20px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: "0.85rem", color: "#94a3b8", textAlign: "center" }}>
                Upload reports to see your health score
              </div>
            )}
          </div>

          {/* AI Brief */}
          <div className={styles.aiBriefCard}>
            <div className={styles.aiBriefIcon}><Sparkles size={17} /></div>
            <div className={styles.aiBriefContent}>
              <h4 className={styles.aiBriefTitle}>AI Health Brief</h4>
              <p className={styles.aiBriefText}>
                Upload clinical reports to unlock AI-generated summaries, flagged values, and
                patient-friendly insights — directly in your vault.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
