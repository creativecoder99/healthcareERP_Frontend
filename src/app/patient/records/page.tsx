"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Upload,
  FileText,
  Search,
  Plus,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileUp,
  X,
  ChevronLeft,
  ChevronRight,
  Brain,
  Activity,
  Binary,
} from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import { useAuthStore } from "../../../lib/auth-store";
import { connectSocket, disconnectSocket, getSocket } from "../../../lib/socket";
import styles from "./records.module.css";

// Category Tabs Configuration
const CATEGORIES = [
  { value: "ALL", label: "All Reports" },
  { value: "BLOOD_TEST", label: "Blood Tests" },
  { value: "IMAGING_MRI", label: "MRI Scans" },
  { value: "IMAGING_CT", label: "CT Scans" },
  { value: "PRESCRIPTION", label: "Prescriptions" },
  { value: "OTHER", label: "Other Docs" },
];

function RecordsVaultContent() {
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lists & Filtering
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("OTHER");
  const [facilityName, setFacilityName] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split("T")[0]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const { user } = useAuthStore();

  // Actions states
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sliding Drawer Details states
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<any | null>(null);
  const [signedUrlForDetail, setSignedUrlForDetail] = useState<string | null>(null);
  const [aiSummaryData, setAiSummaryData] = useState<any | null>(null);
  const [loadingAISummary, setLoadingAISummary] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"summary" | "biomarkers" | "metadata">("summary");

  // WebSocket Live Ingestion Connection
  useEffect(() => {
    if (user) {
      connectSocket(user.id);
      const s = getSocket();

      s.on("record:processed", (data: { recordId: string; status: string }) => {
        console.log("🔔 Record processed WebSocket event:", data);

        // Dynamic status badge updates without page reload
        setRecords((prev) =>
          prev.map((rec) =>
            rec.id === data.recordId ? { ...rec, processingStatus: data.status } : rec
          )
        );

        // If the processed record is open in the active detail drawer, refresh it
        setSelectedRecordForDetail((curr: any) => {
          if (curr && curr.id === data.recordId) {
            fetchAISummary(data.recordId);
            return { ...curr, processingStatus: data.status };
          }
          return curr;
        });
      });
    }
    return () => {
      disconnectSocket();
    };
  }, [user]);

  // Debounced search hook or fetch trigger
  useEffect(() => {
    fetchRecords();
  }, [tab, search, page]);

  // Handle URL "open" auto-view parameter
  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) {
      handleViewRecordById(openId);
    }
  }, [searchParams]);

  // Fetch record list
  async function fetchRecords() {
    setLoading(true);
    try {
      let url = `/records?page=${page}&limit=6`;
      if (tab !== "ALL") {
        url += `&type=${tab}`;
      }
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const res = await apiClient.get(url);
      if (res.data?.success) {
        setRecords(res.data.data.records);
        setTotal(res.data.data.pagination.total);
        setPages(res.data.data.pagination.pages);
      }
    } catch (err) {
      console.error("Failed to load records:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Size validation (50MB)
      if (file.size > 50 * 1024 * 1024) {
        setUploadError("File size exceeds 50MB limit");
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const allowedMimes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!allowedMimes.includes(file.type)) {
        setUploadError("Invalid format. Only PDFs and Images (JPEG, PNG, WEBP) are supported.");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setUploadError("File size exceeds 50MB limit");
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  // Form submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("recordType", uploadType);
    formData.append("recordDate", recordDate);
    formData.append("facilityName", facilityName);

    try {
      const res = await apiClient.post("/records/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded)
          );
          setUploadProgress(percent);
        },
      });

      if (res.data?.success) {
        setUploadSuccess(true);
        setSelectedFile(null);
        setFacilityName("");
        setUploadType("OTHER");
        fetchRecords();
        // Clear success notification after 3 seconds
        setTimeout(() => setUploadSuccess(false), 4000);
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      const errMsg = err.response?.data?.error || "Upload failed. Please try again.";
      setUploadError(errMsg);
    } finally {
      setUploading(false);
    }
  };

  // Fetch AI summary data for detail view
  const fetchAISummary = async (recordId: string) => {
    setLoadingAISummary(true);
    try {
      const res = await apiClient.get(`/records/${recordId}/ai-summary`);
      if (res.data?.success) {
        setAiSummaryData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load AI summary:", err);
    } finally {
      setLoadingAISummary(false);
    }
  };

  // View PDF / image in custom sliding drawer panel
  const handleViewRecord = async (record: any) => {
    setSelectedRecordForDetail(record);
    setSignedUrlForDetail(null);
    setAiSummaryData(null);
    setActiveDetailTab("summary");

    // Fetch signed download URL
    try {
      const res = await apiClient.get(`/records/${record.id}/signed-url`);
      if (res.data?.success && res.data.data.signedUrl) {
        setSignedUrlForDetail(res.data.data.signedUrl);
      }
    } catch (err) {
      console.error("Failed to generate signed download link:", err);
    }

    // Fetch AI Summaries and biomarkers
    fetchAISummary(record.id);
  };

  // Fetch record detail by ID (for URL auto-open parameter compatibility)
  const handleViewRecordById = async (recordId: string) => {
    try {
      const res = await apiClient.get(`/records/${recordId}`);
      if (res.data?.success && res.data.data) {
        handleViewRecord(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch record by ID:", err);
    }
  };

  // Delete document
  const confirmDelete = async () => {
    if (!recordToDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/records/${recordToDelete.id}`);
      fetchRecords();
      setRecordToDelete(null);
    } catch (err) {
      console.error("Deletion failed:", err);
      alert("Failed to delete record. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // Format bytes utility
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={styles.vault}>
      <div className={styles.vaultHeader}>
        <h2 className={styles.vaultTitle}>Your Document Vault</h2>
        <span className="badge-green">{total} Total Items</span>
      </div>

      {/* ─── DROPZONE UPLOAD SECTION ─── */}
      <div className={styles.uploadSection}>
        {!selectedFile ? (
          <div
            className={styles.dropzone}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className={styles.fileInput}
              onChange={handleFileSelect}
              accept=".pdf,image/jpeg,image/png,image/webp"
            />
            <div className={styles.dropzoneIconWrap}>
              <Upload size={24} />
            </div>
            <p className={styles.dropzoneText}>Drag &amp; drop report or click to browse</p>
            <p className={styles.dropzoneSubtext}>PDF, JPEG, PNG, WEBP formats supported (Max size: 50MB)</p>

            {uploadError && (
              <div style={{ color: "#dc2626", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <AlertCircle size={14} /> {uploadError}
              </div>
            )}

            {uploadSuccess && (
              <div style={{ color: "var(--color-primary-medium)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontWeight: 600 }}>
                <CheckCircle size={15} /> Document uploaded and saved securely.
              </div>
            )}
          </div>
        ) : (
          <form className={styles.uploadForm} onSubmit={handleUploadSubmit}>
            <div className={styles.selectedFileCard}>
              <div className={styles.selectedFileInfo}>
                <FileUp size={20} color="var(--color-primary)" />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className={styles.selectedFileName}>{selectedFile.name}</span>
                  <span className={styles.selectedFileSize}>{formatBytes(selectedFile.size)}</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.removeFileBtn}
                onClick={() => setSelectedFile(null)}
                disabled={uploading}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.formFieldsRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Document Category</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className={styles.formSelect}
                  disabled={uploading}
                >
                  <option value="OTHER">Other Documents</option>
                  <option value="BLOOD_TEST">Blood Test Report</option>
                  <option value="URINE_TEST">Urine Test Report</option>
                  <option value="IMAGING_MRI">MRI Scan</option>
                  <option value="IMAGING_CT">CT Scan</option>
                  <option value="IMAGING_XRAY">X-Ray Report</option>
                  <option value="IMAGING_ULTRASOUND">Ultrasound Report</option>
                  <option value="PRESCRIPTION">Prescription File</option>
                  <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                  <option value="VACCINATION">Vaccination Proof</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Facility Name / Lab</label>
                <input
                  type="text"
                  placeholder="e.g. City Diagnostics Lab"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className={styles.formInput}
                  disabled={uploading}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Record Date</label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className={styles.formInput}
                  disabled={uploading}
                />
              </div>
            </div>

            {uploading && (
              <div className={styles.uploadProgressWrap}>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className={styles.progressText}>Uploading: {uploadProgress}%</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedFile(null)}
                disabled={uploading}
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={uploading}
                style={{ padding: "8px 20px", fontSize: "0.85rem" }}
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  "Confirm Upload"
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─── VAULT LISTING & CONTROLS ─── */}
      <div className={styles.listSection}>
        <div className={styles.controlsRow}>
          <div className={styles.tabs}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setTab(cat.value);
                  setPage(1);
                }}
                className={`${styles.tab} ${tab === cat.value ? styles.tabActive : ""}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className={styles.searchBar}>
            <Search size={16} color="var(--color-text-muted)" />
            <input
              type="text"
              placeholder="Search by facility..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Records display list */}
        {loading ? (
          <div style={{ display: "flex", width: "100%", height: 160, alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Searching health records...</span>
            </div>
          </div>
        ) : records.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={36} color="var(--color-primary-light)" />
            <span className={styles.emptyStateText}>No health records found in this category.</span>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {records.map((rec) => (
                <div key={rec.id} className={styles.recordCard}>
                  <div className={styles.cardTop}>
                    <div className={styles.cardIcon}>
                      <FileText size={20} />
                    </div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardName}>{rec.fileName}</span>
                      <div className={styles.cardSub}>
                        <span>{new Date(rec.recordDate).toLocaleDateString("en-IN")}</span>
                        <span>•</span>
                        <span>{formatBytes(rec.fileSize)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        <span className={styles.cardTag}>{rec.recordType}</span>
                        {rec.facilityName && (
                          <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontStyle: "italic", border: "1px solid rgba(34, 92, 52, 0.08)", padding: "0 6px", borderRadius: 4 }}>
                            {rec.facilityName}
                          </span>
                        )}
                      </div>
                      <span 
                        className={styles.cardStatus} 
                        style={{ 
                          color: rec.processingStatus === "PENDING" ? "#d35400" : 
                                 rec.processingStatus === "PROCESSING" ? "#2980b9" :
                                 rec.processingStatus === "FAILED" ? "#c0392b" : 
                                 "var(--color-primary)", 
                          backgroundColor: rec.processingStatus === "PENDING" ? "#fcf2eb" : 
                                           rec.processingStatus === "PROCESSING" ? "#ebf5fb" :
                                           rec.processingStatus === "FAILED" ? "#fdedec" : 
                                           "var(--color-primary-pale)" 
                        }}
                      >
                        {rec.processingStatus}
                      </span>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      className={`${styles.actionBtn} ${styles.viewBtn}`}
                      onClick={() => handleViewRecord(rec)}
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => setRecordToDelete(rec)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pages > 1 && (
              <div className={styles.pagination}>
                <span className={styles.pagesInfo}>
                  Showing Page <strong>{page}</strong> of <strong>{pages}</strong> ({total} total reports)
                </span>
                <div className={styles.paginationBtns}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setPage((p) => Math.min(p + 1, pages))}
                    disabled={page === pages}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Overlay Dialog */}
      {recordToDelete && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <h4 className={styles.dialogTitle}>Delete Document?</h4>
            <p className={styles.dialogText}>
              Are you sure you want to delete <strong>{recordToDelete.fileName}</strong>?
              This action cannot be undone and will permanently erase this file from S3 storage vaults.
            </p>
            <div className={styles.dialogActions}>
              <button
                className="btn-secondary"
                onClick={() => setRecordToDelete(null)}
                disabled={deleting}
                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
              >
                Keep File
              </button>
              <button
                className="btn-primary"
                onClick={confirmDelete}
                disabled={deleting}
                style={{ padding: "6px 16px", fontSize: "0.8rem", backgroundColor: "#dc2626", boxShadow: "0 4px 14px rgba(220, 38, 38, 0.25)" }}
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sliding Details Drawer Panel */}
      {selectedRecordForDetail && (() => {
        const detailStatus = aiSummaryData?.processingStatus || selectedRecordForDetail.processingStatus;
        return (
          <div 
            className={styles.drawerOverlay} 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedRecordForDetail(null);
              }
            }}
          >
            <div className={styles.drawer}>
              <div className={styles.drawerHeader}>
                <div className={styles.drawerTitleWrap}>
                  <h3 className={styles.drawerTitle}>{selectedRecordForDetail.fileName}</h3>
                  <span className={styles.drawerSubtitle}>
                    {selectedRecordForDetail.facilityName ? `${selectedRecordForDetail.facilityName} • ` : ""}
                    {new Date(selectedRecordForDetail.recordDate).toLocaleDateString("en-IN")}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    className={styles.cardStatus}
                    style={{
                      color:
                        detailStatus === "PENDING" ? "#d35400" :
                        detailStatus === "PROCESSING" ? "#2980b9" :
                        detailStatus === "FAILED" ? "#c0392b" :
                        "var(--color-primary)",
                      backgroundColor:
                        detailStatus === "PENDING" ? "#fcf2eb" :
                        detailStatus === "PROCESSING" ? "#ebf5fb" :
                        detailStatus === "FAILED" ? "#fdedec" :
                        "var(--color-primary-pale)",
                      margin: 0
                    }}
                  >
                    {detailStatus}
                  </span>
                  <button
                    className={styles.closeDrawerBtn}
                    onClick={() => setSelectedRecordForDetail(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className={styles.drawerBody}>
                {/* Left Pane (File Viewer) */}
                <div className={styles.previewPane}>
                  {signedUrlForDetail ? (
                    selectedRecordForDetail.mimeType === "application/pdf" ? (
                      <iframe
                        src={`${signedUrlForDetail}#toolbar=0`}
                        className={styles.previewFrame}
                        title={selectedRecordForDetail.fileName}
                      />
                    ) : selectedRecordForDetail.mimeType.startsWith("image/") ? (
                      <img
                        src={signedUrlForDetail}
                        alt={selectedRecordForDetail.fileName}
                        className={styles.previewImage}
                      />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 24, textAlign: "center" }}>
                        <FileText size={48} color="var(--color-text-muted)" />
                        <span style={{ fontSize: "0.9rem", color: "var(--color-text-body)", fontWeight: 600 }}>
                          Preview not available for this file type.
                        </span>
                        <a
                          href={signedUrlForDetail}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                          style={{ padding: "8px 16px", fontSize: "0.8rem", textDecoration: "none" }}
                        >
                          Download Document
                        </a>
                      </div>
                    )
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Loading preview...</span>
                    </div>
                  )}
                </div>

                {/* Right Pane (Structured AI Insights) */}
                <div className={styles.detailsPane}>
                  {detailStatus === "PENDING" || detailStatus === "PROCESSING" ? (
                    <div className={styles.loaderWrapper}>
                      <div className={styles.scanningBox}>
                        <div className={styles.scannerLine} />
                        <Brain className={styles.pulsingBrain} />
                      </div>
                      <p className={styles.loadingText}>AI Pipeline Processing...</p>
                      <p className={styles.loadingSubtext}>
                        We are running OCR, extracting critical biomarkers, and generating patient-friendly summaries. This takes about 10-15 seconds.
                      </p>
                    </div>
                  ) : detailStatus === "FAILED" ? (
                    <div className={styles.loaderWrapper}>
                      <AlertCircle size={48} color="#dc2626" />
                      <p className={styles.loadingText}>AI Processing Failed</p>
                      <p className={styles.loadingSubtext}>
                        Our medical AI failed to extract parameters from this file. It might be low resolution, password-protected, or unsupported.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className={styles.tabsHeader}>
                        <button
                          onClick={() => setActiveDetailTab("summary")}
                          className={`${styles.tabTrigger} ${activeDetailTab === "summary" ? styles.tabTriggerActive : ""}`}
                        >
                          AI Summary
                        </button>
                        <button
                          onClick={() => setActiveDetailTab("biomarkers")}
                          className={`${styles.tabTrigger} ${activeDetailTab === "biomarkers" ? styles.tabTriggerActive : ""}`}
                        >
                          Biomarkers
                        </button>
                        <button
                          onClick={() => setActiveDetailTab("metadata")}
                          className={`${styles.tabTrigger} ${activeDetailTab === "metadata" ? styles.tabTriggerActive : ""}`}
                        >
                          Metadata
                        </button>
                      </div>

                      <div className={styles.tabContentScroll}>
                        {activeDetailTab === "summary" && (
                          <div className={styles.summaryBlock}>
                            <div className={styles.summarySection}>
                              <h5 className={styles.summarySectionTitle}>
                                <Brain size={16} color="var(--color-primary-medium)" /> Plain-English Interpretation
                              </h5>
                              <p className={styles.summaryTextContent}>
                                {aiSummaryData?.aiResult?.summaryText || "No plain-English summary available."}
                              </p>
                            </div>

                            <div className={styles.summarySection} style={{ borderLeft: "4px solid var(--color-accent-gold)", background: "var(--color-accent-gold-pale)" }}>
                              <h5 className={styles.summarySectionTitle} style={{ color: "var(--color-accent-gold)" }}>
                                <Activity size={16} /> Clinical Summary for Doctors
                              </h5>
                              <p className={styles.summaryTextContent}>
                                {aiSummaryData?.aiResult?.clinicalSummary || "No clinical brief available."}
                              </p>
                            </div>
                          </div>
                        )}

                        {activeDetailTab === "biomarkers" && (
                          <div>
                            {!aiSummaryData?.extractedValues || aiSummaryData.extractedValues.length === 0 ? (
                              <div className={styles.emptyState}>
                                <Activity size={36} color="var(--color-primary-light)" />
                                <span className={styles.emptyStateText}>No structured biomarkers extracted from this document.</span>
                              </div>
                            ) : (
                              <table className={styles.biomarkerTable}>
                                <thead>
                                  <tr>
                                    <th className={styles.biomarkerTh}>Biomarker</th>
                                    <th className={styles.biomarkerTh}>Value</th>
                                    <th className={styles.biomarkerTh}>Reference Range</th>
                                    <th className={styles.biomarkerTh}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {aiSummaryData.extractedValues.map((val: any) => {
                                    const isAbnormal = val.isAbnormal;
                                    return (
                                      <tr key={val.id} className={isAbnormal ? styles.biomarkerRowAbnormal : ""}>
                                        <td className={styles.biomarkerTd}>
                                          <div className={styles.biomarkerLabel}>
                                            <span>{val.parameterLabel}</span>
                                            <span className={styles.biomarkerKey}>{val.parameterKey}</span>
                                          </div>
                                        </td>
                                        <td className={styles.biomarkerTd}>
                                          <span
                                            className={styles.biomarkerValue}
                                            style={{ color: isAbnormal ? "#c0392b" : "var(--color-primary-dark)" }}
                                          >
                                            {val.value} {val.unit}
                                          </span>
                                        </td>
                                        <td className={styles.biomarkerTd}>
                                          <span className={styles.biomarkerRange}>
                                            {val.referenceMin !== null && val.referenceMax !== null
                                              ? `${val.referenceMin} - ${val.referenceMax}`
                                              : val.referenceMin !== null
                                              ? `>= ${val.referenceMin}`
                                              : val.referenceMax !== null
                                              ? `<= ${val.referenceMax}`
                                              : "N/A"}
                                          </span>
                                        </td>
                                        <td className={styles.biomarkerTd}>
                                          {isAbnormal ? (
                                            <span
                                              style={{
                                                color: "#c0392b",
                                                backgroundColor: "#fdedec",
                                                border: "1px solid rgba(192, 57, 43, 0.15)",
                                                borderRadius: "9999px",
                                                padding: "2px 8px",
                                                fontSize: "0.7rem",
                                                fontWeight: "700",
                                                textTransform: "uppercase",
                                                display: "inline-block"
                                              }}
                                            >
                                              {val.severity || "Abnormal"}
                                            </span>
                                          ) : (
                                            <span
                                              style={{
                                                color: "var(--color-primary-dark)",
                                                backgroundColor: "var(--color-primary-pale)",
                                                border: "1px solid rgba(34, 92, 52, 0.15)",
                                                borderRadius: "9999px",
                                                padding: "2px 8px",
                                                fontSize: "0.7rem",
                                                fontWeight: "700",
                                                textTransform: "uppercase",
                                                display: "inline-block"
                                              }}
                                            >
                                              Normal
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}

                        {activeDetailTab === "metadata" && (
                          <div className={styles.metadataList}>
                            <div className={styles.metadataItem}>
                              <span className={styles.metadataLabel}>Facility / Lab</span>
                              <span className={styles.metadataValue}>
                                {selectedRecordForDetail.facilityName || "Not Specified"}
                              </span>
                            </div>
                            <div className={styles.metadataItem}>
                              <span className={styles.metadataLabel}>Record Date</span>
                              <span className={styles.metadataValue}>
                                {new Date(selectedRecordForDetail.recordDate).toLocaleDateString("en-IN")}
                              </span>
                            </div>
                            <div className={styles.metadataItem}>
                              <span className={styles.metadataLabel}>Uploaded At</span>
                              <span className={styles.metadataValue}>
                                {new Date(selectedRecordForDetail.uploadedAt).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className={styles.metadataItem}>
                              <span className={styles.metadataLabel}>Category Type</span>
                              <span className={styles.metadataValue}>{selectedRecordForDetail.recordType}</span>
                            </div>
                            <div className={styles.metadataItem}>
                              <span className={styles.metadataLabel}>File Size</span>
                              <span className={styles.metadataValue}>
                                {formatBytes(selectedRecordForDetail.fileSize)}
                              </span>
                            </div>
                            <div className={styles.metadataItem}>
                              <span className={styles.metadataLabel}>AI Analysis Engine</span>
                              <span className={styles.metadataValue}>
                                {aiSummaryData?.aiResult?.modelVersion || "N/A"}
                              </span>
                            </div>

                            {aiSummaryData?.aiResult?.confidence !== undefined && (
                              <div className={styles.confidenceWrapper}>
                                <div className={styles.confidenceHeader}>
                                  <span>OCR Extraction Confidence</span>
                                  <span>{Math.round(aiSummaryData.aiResult.confidence * 100)}%</span>
                                </div>
                                <div className={styles.confidenceBarBg}>
                                  <div
                                    className={styles.confidenceBarFill}
                                    style={{
                                      width: `${aiSummaryData.aiResult.confidence * 100}%`,
                                      backgroundColor:
                                        aiSummaryData.aiResult.confidence > 0.85
                                          ? "var(--color-primary-medium)"
                                          : aiSummaryData.aiResult.confidence > 0.6
                                          ? "var(--color-accent-gold)"
                                          : "#dc2626",
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function RecordsVault() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", width: "100%", height: "50vh", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
      </div>
    }>
      <RecordsVaultContent />
    </Suspense>
  );
}
