"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea, ReferenceLine, Dot,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, RefreshCw } from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import styles from "./analytics.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParameterSummary {
  parameterKey: string;
  parameterLabel: string;
  unit: string;
  latestValue: number;
  latestDate: string;
  isAbnormal: boolean;
  severity: string | null;
  referenceMin: number | null;
  referenceMax: number | null;
  trend: "up" | "down" | "stable";
  dataPointCount: number;
}

interface DataPoint {
  date: string;
  value: number;
  isAbnormal: boolean;
  severity: string | null;
  recordId: string;
}

interface TrendSeries {
  parameterKey: string;
  parameterLabel: string;
  unit: string;
  referenceMin: number | null;
  referenceMax: number | null;
  data: DataPoint[];
}

interface HealthScore {
  score: number | null;
  grade: string | null;
  trend: "improving" | "stable" | "declining";
  trackedCount: number;
  abnormalCount: number;
  normalCount: number;
  lastUpdated: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const severityColor = (s: string | null) =>
  s === "CRITICAL" ? "#ef4444" : s === "MODERATE" ? "#f97316" : "#eab308";

const gradeColor = (g: string | null) =>
  g === "Excellent" ? "#22c55e" : g === "Good" ? "#6366f1" : g === "Fair" ? "#f97316" : "#ef4444";

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload?.isAbnormal) return <Dot cx={cx} cy={cy} r={4} fill="#6366f1" stroke="#fff" strokeWidth={2} />;
  return <Dot cx={cx} cy={cy} r={6} fill={severityColor(payload.severity)} stroke="#fff" strokeWidth={2} />;
};

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as DataPoint;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{label}</p>
      <p className={styles.tooltipValue}>
        {d?.value} <span className={styles.tooltipUnit}>{unit}</span>
      </p>
      {d?.isAbnormal && (
        <p className={styles.tooltipBadge} style={{ color: severityColor(d.severity) }}>
          ⚠ {d.severity ?? "Abnormal"}
        </p>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<ParameterSummary[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendSeries | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [abnormalOnly, setAbnormalOnly] = useState(false);

  // Fetch overview
  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, scoreRes] = await Promise.all([
          apiClient.get("/analytics/summary"),
          apiClient.get("/analytics/health-score"),
        ]);
        if (sumRes.data?.success) setSummary(sumRes.data.data.parameters);
        if (scoreRes.data?.success) setHealthScore(scoreRes.data.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Fetch trend chart for selected parameter
  const loadTrend = useCallback(async (key: string) => {
    setChartLoading(true);
    try {
      const params = new URLSearchParams({ parameter: key });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await apiClient.get(`/analytics/trends?${params}`);
      if (res.data?.success) {
        const series = (res.data.data as TrendSeries[]).find((s) => s.parameterKey === key);
        setTrendData(series ?? null);
      }
    } catch { /* ignore */ }
    finally { setChartLoading(false); }
  }, [from, to]);

  useEffect(() => {
    if (selected) loadTrend(selected);
  }, [selected, loadTrend]);

  const displayed = abnormalOnly ? summary.filter((p) => p.isAbnormal) : summary;

  return (
    <div className={styles.page}>
      {/* ── Health Score Banner ── */}
      <div className={styles.scoreBanner}>
        <div className={styles.scoreLeft}>
          <Activity size={20} className={styles.scoreIcon} />
          <span className={styles.scoreLabel}>Health Score</span>
        </div>
        {healthScore?.score != null ? (
          <div className={styles.scoreRight}>
            <span className={styles.scoreBig} style={{ color: gradeColor(healthScore.grade) }}>
              {healthScore.score}
            </span>
            <span className={styles.scoreGrade} style={{ color: gradeColor(healthScore.grade) }}>
              {healthScore.grade}
            </span>
            <span className={styles.scoreTrend}>
              {healthScore.trend === "improving" ? <TrendingUp size={16} color="#22c55e" /> :
               healthScore.trend === "declining" ? <TrendingDown size={16} color="#ef4444" /> :
               <Minus size={16} color="#94a3b8" />}
              <span style={{ color: healthScore.trend === "improving" ? "#22c55e" : healthScore.trend === "declining" ? "#ef4444" : "#94a3b8" }}>
                {healthScore.trend}
              </span>
            </span>
            <span className={styles.scoreStats}>
              {healthScore.normalCount} normal · {healthScore.abnormalCount} flagged of {healthScore.trackedCount} values
            </span>
          </div>
        ) : loading ? (
          <span className={styles.scorePlaceholder}>Computing…</span>
        ) : (
          <span className={styles.scorePlaceholder}>Upload reports to see your health score</span>
        )}
      </div>

      <div className={styles.layout}>
        {/* ── Parameter Panel ── */}
        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Tracked Parameters</span>
            <span className={styles.panelCount}>{summary.length}</span>
          </div>
          <label className={styles.filterRow}>
            <input
              type="checkbox"
              checked={abnormalOnly}
              onChange={(e) => setAbnormalOnly(e.target.checked)}
              className={styles.filterCheck}
            />
            <span>Abnormal only</span>
          </label>
          {loading ? (
            <div className={styles.panelLoading}>Loading…</div>
          ) : displayed.length === 0 ? (
            <p className={styles.panelEmpty}>
              {abnormalOnly ? "No abnormal values found." : "Upload medical reports to see tracked parameters."}
            </p>
          ) : (
            <ul className={styles.paramList}>
              {displayed.map((p) => (
                <li
                  key={p.parameterKey}
                  className={`${styles.paramItem} ${selected === p.parameterKey ? styles.paramItemActive : ""}`}
                  onClick={() => setSelected(p.parameterKey)}
                >
                  <div className={styles.paramTop}>
                    <span className={styles.paramLabel}>{p.parameterLabel}</span>
                    {p.isAbnormal && (
                      <AlertTriangle size={13} color={severityColor(p.severity)} />
                    )}
                  </div>
                  <div className={styles.paramBottom}>
                    <span className={styles.paramValue} style={{ color: p.isAbnormal ? severityColor(p.severity) : "inherit" }}>
                      {p.latestValue} {p.unit}
                    </span>
                    <span className={styles.paramTrend}>
                      {p.trend === "up" ? <TrendingUp size={12} /> : p.trend === "down" ? <TrendingDown size={12} /> : <Minus size={12} />}
                    </span>
                  </div>
                  <div className={styles.paramMeta}>{p.latestDate} · {p.dataPointCount} reading{p.dataPointCount !== 1 ? "s" : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* ── Chart Area ── */}
        <main className={styles.chartArea}>
          {!selected ? (
            <div className={styles.chartEmpty}>
              <Activity size={40} className={styles.chartEmptyIcon} />
              <p>Select a parameter from the left panel to view its trend chart.</p>
            </div>
          ) : (
            <>
              <div className={styles.chartHeader}>
                <div>
                  <h2 className={styles.chartTitle}>
                    {trendData?.parameterLabel ?? selected}
                    {trendData?.unit && <span className={styles.chartUnit}> ({trendData.unit})</span>}
                  </h2>
                  {trendData && (
                    <p className={styles.chartSub}>{trendData.data.length} data point{trendData.data.length !== 1 ? "s" : ""}</p>
                  )}
                </div>
                <div className={styles.chartControls}>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className={styles.dateInput}
                    placeholder="From"
                  />
                  <span className={styles.dateSep}>–</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className={styles.dateInput}
                    placeholder="To"
                  />
                  <button className={styles.refreshBtn} onClick={() => loadTrend(selected)} title="Refresh">
                    <RefreshCw size={15} />
                  </button>
                </div>
              </div>

              {chartLoading ? (
                <div className={styles.chartLoading}>
                  <div className={styles.spinner} />
                </div>
              ) : !trendData || trendData.data.length === 0 ? (
                <div className={styles.chartEmpty}>
                  <p>No data in this range for {selected}.</p>
                </div>
              ) : (
                <>
                  <div className={styles.refBand}>
                    {trendData.referenceMin != null && trendData.referenceMax != null && (
                      <span>
                        Reference range: <strong>{trendData.referenceMin} – {trendData.referenceMax} {trendData.unit}</strong>
                      </span>
                    )}
                  </div>
                  <ResponsiveContainer width="100%" height={340}>
                    <LineChart data={trendData.data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip content={<CustomTooltip unit={trendData.unit} />} />
                      {trendData.referenceMin != null && trendData.referenceMax != null && (
                        <ReferenceArea
                          y1={trendData.referenceMin}
                          y2={trendData.referenceMax}
                          fill="#6366f1"
                          fillOpacity={0.07}
                          stroke="#6366f1"
                          strokeOpacity={0.2}
                        />
                      )}
                      {trendData.referenceMin != null && (
                        <ReferenceLine y={trendData.referenceMin} stroke="#6366f1" strokeDasharray="4 2" strokeOpacity={0.4} />
                      )}
                      {trendData.referenceMax != null && (
                        <ReferenceLine y={trendData.referenceMax} stroke="#6366f1" strokeDasharray="4 2" strokeOpacity={0.4} />
                      )}
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={<CustomDot />}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Abnormal Legend */}
                  <div className={styles.legend}>
                    <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#6366f1" }} /> Normal</span>
                    <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#eab308" }} /> Mild</span>
                    <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#f97316" }} /> Moderate</span>
                    <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#ef4444" }} /> Critical</span>
                    <span className={styles.legendItem}><span className={styles.legendBand} /> Reference range</span>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
