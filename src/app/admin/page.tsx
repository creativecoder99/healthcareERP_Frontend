"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Users,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Terminal as TermIcon
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { apiClient } from "../../lib/api-client";
import styles from "./page.module.css";

interface AnalyticsData {
  overview: {
    totalPatients: number;
    totalDoctors: number;
    totalPaidSubscribers: number;
    totalRevenue: number;
  };
  planStats: Record<string, number>;
  geographicBreakdown: Array<{ state: string; count: number }>;
  registrationTrend: Array<{ date: string; patientCount: number; doctorCount: number }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Populate retro console logs
    const bootLogs = [
      `[SYSOP] INITIALIZING SECURITY OVERLAY SHIELD... [OK]`,
      `[SYSOP] LINKING DATABASE PIPELINE TO PLATFORM_ADMIN CREDENTIALS...`,
      `[SYSOP] DEPLOYING ANALYTICS RETRIEVAL ENGINE PROTOCOL...`,
      `[SYSOP] SECURE SESSION ENCRYPTED VIA AES-GCM-256`,
    ];
    setLogs(bootLogs);

    const fetchAnalytics = async () => {
      try {
        const response = await apiClient.get("/admin/analytics");
        if (response.data?.success) {
          setData(response.data.data);
          setLogs((prev) => [
            ...prev,
            `[DB_LOG] RECEIVED ANALYTICS RECONSTRUCT PACKETS SUCCESFULLY`,
            `[SYSOP] READY FOR SYSOP ADMINISTRATIVE COMMANDS.`
          ]);
        } else {
          throw new Error("API failed to return payload");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Connection failed");
        setLogs((prev) => [...prev, `[ERR_ALERT] PIPELINE DEGRADED: ${err.message}`]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Simple log adding wrapper
  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[CMD_EVENT] ${new Date().toLocaleTimeString()} — ${msg}`].slice(-8));
  };

  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.cyberLoader}>
          <div className={styles.loaderRing} />
          <span className={styles.pulseText}>DECRYPTING HUD METRICS...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.errorBox}>
          <AlertTriangle className={styles.errorIcon} size={48} />
          <h2>SYS_ALERT: SECURE PIPELINE FAULT</h2>
          <p>{error}</p>
          <button className={styles.retryBtn} onClick={() => window.location.reload()}>RE-ESTABLISH LINK</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Chart data preparation: Free vs Paid
  const freeCount = data.planStats.FREE || 0;
  const paidCount = Object.keys(data.planStats)
    .filter((key) => key !== "FREE")
    .reduce((sum, key) => sum + (data.planStats[key] || 0), 0);

  const subChartData = [
    { name: "Free Tier", value: freeCount, color: "#06b6d4" },
    { name: "Paid Subscriptions", value: paidCount, color: "#8b5cf6" },
  ];

  // Geographics chart config
  const geoData = data.geographicBreakdown.slice(0, 6);

  return (
    <div className={styles.dashboardContainer}>
      {/* HUD Header Overview Cards */}
      <section className={styles.metricsGrid}>
        <div className={styles.metricCard} onClick={() => addLog("Queried patient telemetry")}>
          <div className={styles.cardHeader}>
            <Users size={20} className={styles.cyanIcon} />
            <span className={styles.cardLabel}>TOTAL_PATIENTS_REGISTERED</span>
          </div>
          <div className={styles.cardVal}>{data.overview.totalPatients}</div>
          <div className={styles.cardFooter}>NODE_ID: 104 // HEALTHY</div>
        </div>

        <div className={styles.metricCard} onClick={() => addLog("Audited provider licenses")}>
          <div className={styles.cardHeader}>
            <ShieldCheck size={20} className={styles.purpleIcon} />
            <span className={styles.cardLabel}>VERIFIED_DOCTOR_ACCOUNTS</span>
          </div>
          <div className={styles.cardVal}>{data.overview.totalDoctors}</div>
          <div className={styles.cardFooter}>AUTH: PLATFORM_VERIFIED</div>
        </div>

        <div className={styles.metricCard} onClick={() => addLog("Analyzed billing cycles")}>
          <div className={styles.cardHeader}>
            <TrendingUp size={20} className={styles.emeraldIcon} />
            <span className={styles.cardLabel}>ACTIVE_PAID_SUBSCRIBERS</span>
          </div>
          <div className={styles.cardVal}>{data.overview.totalPaidSubscribers}</div>
          <div className={styles.cardFooter}>CONVERSION: HEALTHY_GROWTH</div>
        </div>

        <div className={styles.metricCard} onClick={() => addLog("Audited net earnings ledger")}>
          <div className={styles.cardHeader}>
            <DollarSign size={20} className={styles.pinkIcon} />
            <span className={styles.cardLabel}>PLATFORM_NET_REVENUE</span>
          </div>
          <div className={styles.cardVal}>₹{data.overview.totalRevenue.toLocaleString()}</div>
          <div className={styles.cardFooter}>PROVIDER: RAZORPAY_GATEWAY</div>
        </div>
      </section>

      {/* Visual Analytics Row */}
      <section className={styles.visualRow}>
        {/* Registration Line Trend */}
        <div className={styles.chartBlock}>
          <h3 className={styles.chartTitle}>SYSOP // USER_REGISTRATION_TRENDS_30D</h3>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.registrationTrend}>
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f0e17", border: "1px solid #8b5cf6", borderRadius: "8px" }}
                  labelStyle={{ color: "#a78bfa", fontWeight: "bold" }}
                />
                <Line type="monotone" dataKey="patientCount" name="Patients" stroke="#06b6d4" strokeWidth={2.5} activeDot={{ r: 8 }} dot={false} />
                <Line type="monotone" dataKey="doctorCount" name="Doctors" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Pie chart */}
        <div className={styles.donutBlock}>
          <h3 className={styles.chartTitle}>SYSOP // SUBSCRIPTION_TIER_RATIO</h3>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={subChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f0e17", border: "1px solid #06b6d4", borderRadius: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.donutLegends}>
              {subChartData.map((d, idx) => (
                <div key={idx} className={styles.donutLegendItem}>
                  <span className={styles.legendColor} style={{ backgroundColor: d.color }} />
                  <span className={styles.legendText}>{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* States Map/Bar and Retro System Terminal */}
      <section className={styles.bottomGrid}>
        {/* Geo breakdown */}
        <div className={styles.geoBlock}>
          <h3 className={styles.chartTitle}>SYSOP // GEOGRAPHICAL_DENSITY</h3>
          <div className={styles.chartWrap}>
            {geoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={geoData}>
                  <XAxis dataKey="state" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f0e17", border: "1px solid #ec4899", borderRadius: "8px" }}
                  />
                  <Bar dataKey="count" name="Registered Patients" fill="#ec4899" radius={[4, 4, 0, 0]}>
                    {geoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#ec4899" : "#f472b6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyState}>No geographical registration logs found.</div>
            )}
          </div>
        </div>

        {/* Live Sysop Monospaced Console */}
        <div className={styles.consoleBlock}>
          <div className={styles.consoleHeader}>
            <TermIcon size={14} className={styles.terminalIcon} />
            <span>SYSOP_COCKPIT_FEED_STREAM</span>
          </div>
          <div className={styles.consoleFeed}>
            {logs.map((log, idx) => (
              <div key={idx} className={styles.consoleLine}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
