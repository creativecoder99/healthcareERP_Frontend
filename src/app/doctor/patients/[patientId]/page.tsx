"use client";

import React, { useEffect, useState, use } from "react";
import {
  FileText,
  Download,
  Sparkles,
  NotebookPen,
  Plus,
  ChevronLeft,
  Edit2,
  Save,
  X,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "../../../../lib/api-client";

interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  heightCm: number | null;
  weightKg: number | null;
  allergies: string[];
  user: { email: string };
}

interface Record_ {
  id: string;
  fileName: string;
  recordType: string;
  recordDate: string | null;
  fileSize: number;
  mimeType: string;
  processingStatus: string;
  uploadedAt: string;
  facilityName: string | null;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const RECORD_TABS = ["All", "LAB_RESULT", "IMAGING", "PRESCRIPTION", "CLINICAL_NOTES", "VACCINATION", "DISCHARGE_SUMMARY"];

export default function DoctorPatientDetailPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<Record_[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"records" | "notes" | "ai">("records");
  const [recordTypeFilter, setRecordTypeFilter] = useState("All");
  const [noteContent, setNoteContent] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [aiSummary, setAiSummary] = useState<Record<string, any>>({});
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [patRes, recRes, noteRes] = await Promise.all([
        apiClient.get(`/doctor/patients/${patientId}`),
        apiClient.get(`/doctor/patients/${patientId}/records?limit=50`),
        apiClient.get(`/doctor/patients/${patientId}/notes`),
      ]);
      if (patRes.data?.success) setPatient(patRes.data.data);
      if (recRes.data?.success) {
        setRecords(recRes.data.data.records);
        setTotalRecords(recRes.data.data.pagination.total);
      }
      if (noteRes.data?.success) setNotes(noteRes.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [patientId]);

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async (recordId: string) => {
    setUrlLoading(recordId);
    try {
      const res = await apiClient.get(`/doctor/patients/${patientId}/records/${recordId}/signed-url`);
      if (res.data?.success) window.open(res.data.data.url, "_blank");
    } catch {
      // ignore
    } finally {
      setUrlLoading(null);
    }
  };

  const handleAISummary = async (recordId: string) => {
    if (aiSummary[recordId]) return;
    setAiLoading(recordId);
    try {
      const res = await apiClient.get(`/doctor/patients/${patientId}/records/${recordId}/ai-summary`);
      if (res.data?.success) setAiSummary((prev) => ({ ...prev, [recordId]: res.data.data }));
    } catch {
      // ignore
    } finally {
      setAiLoading(null);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setNoteLoading(true);
    try {
      await apiClient.post(`/doctor/patients/${patientId}/notes`, { content: noteContent.trim() });
      setNoteContent("");
      const res = await apiClient.get(`/doctor/patients/${patientId}/notes`);
      if (res.data?.success) setNotes(res.data.data);
    } catch {
      // ignore
    } finally {
      setNoteLoading(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;
    try {
      await apiClient.put(`/doctor/patients/${patientId}/notes/${noteId}`, { content: editContent.trim() });
      setEditingNoteId(null);
      const res = await apiClient.get(`/doctor/patients/${patientId}/notes`);
      if (res.data?.success) setNotes(res.data.data);
    } catch {
      // ignore
    }
  };

  const filteredRecords = recordTypeFilter === "All"
    ? records
    : records.filter((r) => r.recordType === recordTypeFilter);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, border: "3px solid #dcfce7", borderTop: "3px solid #16a34a", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Loading patient...</span>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#a08060" }}>
        <p>Patient not found or access denied.</p>
        <Link href="/doctor/patients" style={{ color: "#16a34a", fontWeight: 600 }}>← Back to patients</Link>
      </div>
    );
  }

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Back + header */}
      <div>
        <Link href="/doctor/patients" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.83rem", color: "#16a34a", textDecoration: "none", fontWeight: 600, marginBottom: 12 }}>
          <ChevronLeft size={15} /> Back to Patients
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #16a34a, #4ade80)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "1.4rem" }}>
            {patient.fullName.charAt(0)}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#2c2520" }}>{patient.fullName}</h2>
            <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
              {age !== null && <span style={{ fontSize: "0.78rem", color: "#a08060" }}>{age} yrs</span>}
              {patient.gender && <span style={{ fontSize: "0.78rem", color: "#a08060" }}>· {patient.gender}</span>}
              {patient.bloodGroup && <span style={{ fontSize: "0.73rem", background: "#fef3c7", color: "#d97706", padding: "1px 8px", borderRadius: 99, fontWeight: 600 }}>{patient.bloodGroup}</span>}
              {patient.allergies.length > 0 && <span style={{ fontSize: "0.73rem", background: "#fee2e2", color: "#dc2626", padding: "1px 8px", borderRadius: 99, fontWeight: 600 }}>Allergies: {patient.allergies.join(", ")}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Quick vitals */}
      {(patient.heightCm || patient.weightKg) && (
        <div style={{ display: "flex", gap: 14 }}>
          {patient.heightCm && (
            <div style={{ background: "#fff", border: "1px solid #f0e8e0", borderRadius: 10, padding: "12px 18px" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2c2520" }}>{patient.heightCm} cm</div>
              <div style={{ fontSize: "0.73rem", color: "#a08060" }}>Height</div>
            </div>
          )}
          {patient.weightKg && (
            <div style={{ background: "#fff", border: "1px solid #f0e8e0", borderRadius: 10, padding: "12px 18px" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2c2520" }}>{patient.weightKg} kg</div>
              <div style={{ fontSize: "0.73rem", color: "#a08060" }}>Weight</div>
            </div>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, background: "#f0e8e0", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["records", "notes", "ai"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ padding: "8px 18px", border: "none", borderRadius: 8, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", background: tab === t ? "#fff" : "transparent", color: tab === t ? "#2c2520" : "#a08060", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}
          >
            {t === "records" ? `Records (${totalRecords})` : t === "notes" ? `Notes (${notes.length})` : "AI Summaries"}
          </button>
        ))}
      </div>

      {/* Records tab */}
      {tab === "records" && (
        <div style={{ background: "#fff", border: "1px solid #f0e8e0", borderRadius: 14, padding: 24 }}>
          {/* Type filter */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {RECORD_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setRecordTypeFilter(t)}
                style={{ padding: "5px 14px", border: "1px solid", borderRadius: 99, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", background: recordTypeFilter === t ? "#16a34a" : "#fff", color: recordTypeFilter === t ? "#fff" : "#a08060", borderColor: recordTypeFilter === t ? "#16a34a" : "#e8ddd4" }}
              >
                {t === "All" ? "All" : t.replace("_", " ")}
              </button>
            ))}
          </div>
          {filteredRecords.length === 0 ? (
            <p style={{ fontSize: "0.88rem", color: "#a08060", textAlign: "center", padding: "32px 0" }}>No records in this category.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredRecords.map((rec) => (
                <div key={rec.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: "#fcfaf7", border: "1px solid #f0e8e0", borderRadius: 10, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FileText size={17} color="#16a34a" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#2c2520", fontSize: "0.9rem" }}>{rec.fileName}</div>
                      <div style={{ fontSize: "0.73rem", color: "#a08060", display: "flex", gap: 8, marginTop: 2 }}>
                        <span>{formatDate(rec.recordDate)}</span>
                        <span>·</span>
                        <span>{formatSize(rec.fileSize)}</span>
                        <span>·</span>
                        <span style={{ textTransform: "capitalize" }}>{rec.recordType.replace("_", " ")}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={() => handleAISummary(rec.id)}
                      disabled={aiLoading === rec.id}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 7, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      <Sparkles size={12} /> AI Summary
                    </button>
                    <button
                      onClick={() => handleDownload(rec.id)}
                      disabled={urlLoading === rec.id}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", background: "#fff", color: "#5c534c", border: "1px solid #e8ddd4", borderRadius: 7, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      <Download size={12} /> {urlLoading === rec.id ? "..." : "View"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes tab */}
      {tab === "notes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Add note */}
          <div style={{ background: "#fff", border: "1px solid #f0e8e0", borderRadius: 14, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <NotebookPen size={15} color="#16a34a" />
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", color: "#2c2520" }}>Add Clinical Note</h4>
            </div>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Enter clinical observations, diagnosis notes, or treatment plans…"
              rows={4}
              style={{ width: "100%", border: "1px solid #e8ddd4", borderRadius: 8, padding: "12px", fontSize: "0.88rem", color: "#2c2520", background: "#fcfaf7", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
            <button
              onClick={handleAddNote}
              disabled={noteLoading || !noteContent.trim()}
              style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: "0.86rem", cursor: "pointer", opacity: noteLoading || !noteContent.trim() ? 0.6 : 1 }}
            >
              <Plus size={14} /> {noteLoading ? "Saving..." : "Save Note"}
            </button>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <p style={{ textAlign: "center", color: "#a08060", padding: "28px 0", fontSize: "0.88rem" }}>No notes yet. Add one above.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} style={{ background: "#fff", border: "1px solid #f0e8e0", borderRadius: 12, padding: "18px 20px" }}>
                {editingNoteId === note.id ? (
                  <>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={4}
                      style={{ width: "100%", border: "1px solid #e8ddd4", borderRadius: 8, padding: "10px", fontSize: "0.88rem", color: "#2c2520", background: "#fcfaf7", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                    />
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <button onClick={() => handleUpdateNote(note.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 7, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
                        <Save size={13} /> Save
                      </button>
                      <button onClick={() => setEditingNoteId(null)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 7, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ margin: "0 0 12px", fontSize: "0.9rem", color: "#2c2520", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{note.content}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.73rem", color: "#a08060" }}>
                        <Clock size={11} />
                        <span>{formatDate(note.createdAt)}</span>
                        {note.updatedAt !== note.createdAt && <span>· edited</span>}
                      </div>
                      <button
                        onClick={() => { setEditingNoteId(note.id); setEditContent(note.content); }}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: "#fff", color: "#5c534c", border: "1px solid #e8ddd4", borderRadius: 7, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* AI Summaries tab */}
      {tab === "ai" && (
        <div style={{ background: "#fff", border: "1px solid #f0e8e0", borderRadius: 14, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Sparkles size={16} color="#7c3aed" />
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "#2c2520" }}>AI Summaries</h3>
          </div>
          {records.length === 0 ? (
            <p style={{ color: "#a08060", fontSize: "0.88rem" }}>No records available for AI analysis.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {records.map((rec) => (
                <div key={rec.id} style={{ border: "1px solid #f0e8e0", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#fcfaf7", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <span style={{ fontWeight: 600, color: "#2c2520", fontSize: "0.88rem" }}>{rec.fileName}</span>
                      <span style={{ marginLeft: 8, fontSize: "0.73rem", color: "#a08060" }}>{formatDate(rec.recordDate)}</span>
                    </div>
                    {!aiSummary[rec.id] && (
                      <button
                        onClick={() => handleAISummary(rec.id)}
                        disabled={aiLoading === rec.id}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 7, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", opacity: aiLoading === rec.id ? 0.7 : 1 }}
                      >
                        <Sparkles size={12} /> {aiLoading === rec.id ? "Loading..." : "Load Summary"}
                      </button>
                    )}
                  </div>
                  {aiSummary[rec.id] && (
                    <div style={{ padding: "14px 16px" }}>
                      {aiSummary[rec.id].summaryText && (
                        <p style={{ margin: "0 0 10px", fontSize: "0.88rem", color: "#2c2520", lineHeight: 1.6 }}>{aiSummary[rec.id].summaryText}</p>
                      )}
                      {aiSummary[rec.id].clinicalSummary && (
                        <div style={{ marginTop: 8, padding: "10px 14px", background: "#f5f3ff", borderRadius: 8 }}>
                          <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "#7c3aed", marginBottom: 4 }}>CLINICAL SUMMARY</div>
                          <p style={{ margin: 0, fontSize: "0.85rem", color: "#2c2520" }}>{aiSummary[rec.id].clinicalSummary}</p>
                        </div>
                      )}
                      {aiSummary[rec.id].extractedValues?.length > 0 && (
                        <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {aiSummary[rec.id].extractedValues.map((v: any) => (
                            <div key={v.id} style={{ padding: "4px 12px", background: v.flagged ? "#fee2e2" : "#f0fdf4", border: `1px solid ${v.flagged ? "#fca5a5" : "#bbf7d0"}`, borderRadius: 99, fontSize: "0.75rem" }}>
                              <span style={{ fontWeight: 600, color: "#2c2520" }}>{v.parameterKey}:</span>{" "}
                              <span style={{ color: v.flagged ? "#dc2626" : "#16a34a" }}>{v.value} {v.unit}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ marginTop: 8, fontSize: "0.72rem", color: "#a08060" }}>
                        Confidence: {(aiSummary[rec.id].confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
