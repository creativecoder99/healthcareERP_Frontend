"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Video,
  Clock,
  User,
  AlertCircle,
  FileText,
  CheckCircle,
  Clock3,
} from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import styles from "./appointments.module.css";

interface Appointment {
  id: string;
  scheduledAt: string;
  durationMins: number;
  status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes: string | null;
  cancelReason: string | null;
  patient: {
    id: string;
    fullName: string;
    bloodGroup: string | null;
    avatarUrl: string | null;
  };
  videoSession: {
    roomId: string;
    status: string;
  } | null;
}

interface AvailabilitySlot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMins: number;
  isActive: boolean;
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function DoctorAppointmentsPage() {
  const router = useRouter();

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Availability form states
  const [savingSlots, setSavingSlots] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");

  // Cancel states
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [apptsRes, availRes] = await Promise.all([
        apiClient.get("/appointments"),
        apiClient.get("/appointments/doctor/availability"),
      ]);

      if (apptsRes.data?.success) {
        setAppointments(apptsRes.data.data);
      }

      if (availRes.data?.success) {
        // Initialize all 7 days of week, overlaying with saved ones
        const saved = availRes.data.data as AvailabilitySlot[];
        const initial = Array.from({ length: 7 }, (_, i) => {
          const match = saved.find((s) => s.dayOfWeek === i);
          return match
            ? { ...match }
            : { dayOfWeek: i, startTime: "09:00", endTime: "17:00", slotMins: 30, isActive: false };
        });
        setAvailabilitySlots(initial);
      }
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = (dayIndex: number, field: keyof AvailabilitySlot, value: any) => {
    setAvailabilitySlots((prev) =>
      prev.map((slot) => (slot.dayOfWeek === dayIndex ? { ...slot, [field]: value } : slot))
    );
    setSaveSuccess("");
    setSaveError("");
  };

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSlots(true);
    setSaveSuccess("");
    setSaveError("");

    try {
      const activeSlots = availabilitySlots.filter((s) => s.isActive);
      const res = await apiClient.post("/appointments/doctor/availability", {
        slots: activeSlots,
      });

      if (res.data?.success) {
        setSaveSuccess("Weekly schedule updated successfully!");
      }
    } catch (err: any) {
      setSaveError(err.response?.data?.message || "Failed to update availability schedule.");
    } finally {
      setSavingSlots(false);
    }
  };

  const handleConfirmAppt = async (id: string) => {
    try {
      const res = await apiClient.patch(`/appointments/${id}`, {
        status: "CONFIRMED",
      });

      if (res.data?.success) {
        // Reload list
        const apptsRes = await apiClient.get("/appointments");
        if (apptsRes.data?.success) setAppointments(apptsRes.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to confirm appointment.");
    }
  };

  const handleCancelClick = (appt: Appointment) => {
    setCancellingAppt(appt);
    setCancelReason("");
  };

  const handleCancelConfirm = async () => {
    if (!cancellingAppt || !cancelReason.trim()) return;

    setCancelLoading(true);
    try {
      const res = await apiClient.patch(`/appointments/${cancellingAppt.id}`, {
        status: "CANCELLED",
        cancelReason: cancelReason.trim(),
      });

      if (res.data?.success) {
        setCancellingAppt(null);
        // Reload list
        const apptsRes = await apiClient.get("/appointments");
        if (apptsRes.data?.success) setAppointments(apptsRes.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel appointment.");
    } finally {
      setCancelLoading(false);
    }
  };

  const isCallEnabled = (scheduledAt: string) => {
    const time = new Date(scheduledAt).getTime();
    const diff = time - Date.now();
    // Enable join button 10 mins before and up to 30 mins after scheduled slot
    return diff <= 10 * 60 * 1000 && diff >= -30 * 60 * 1000;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const upcomingAppts = appointments.filter(
    (a) => a.status === "SCHEDULED" || a.status === "CONFIRMED" || a.status === "IN_PROGRESS"
  );
  const pastAppts = appointments.filter(
    (a) => a.status === "COMPLETED" || a.status === "CANCELLED" || a.status === "NO_SHOW"
  );

  if (loading) {
    return (
      <div style={{ display: "flex", width: "100%", height: "50vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, border: "3px solid #eef1ec", borderTop: "3px solid #618764", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: 500 }}>Loading scheduling client…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
        {/* Availability planner */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Clock3 size={18} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Weekly Slot Planner</h3>
              <p className={styles.cardSub}>Set your active days and hours to let patients book slots</p>
            </div>
          </div>

          <form onSubmit={handleSaveAvailability} className={styles.formGrid}>
            <div>
              {availabilitySlots.map((slot, idx) => (
                <div key={slot.dayOfWeek} className={styles.availabilityRow}>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={slot.isActive}
                      onChange={(e) => handleSlotChange(slot.dayOfWeek, "isActive", e.target.checked)}
                    />
                    <span className={styles.dayLabel} style={{ opacity: slot.isActive ? 1 : 0.5 }}>
                      {WEEKDAYS[slot.dayOfWeek]}
                    </span>
                  </label>

                  {slot.isActive && (
                    <div className={styles.hoursInputs}>
                      <input
                        type="text"
                        placeholder="09:00"
                        className={styles.input}
                        style={{ width: 80, padding: "6px 10px" }}
                        value={slot.startTime}
                        onChange={(e) => handleSlotChange(slot.dayOfWeek, "startTime", e.target.value)}
                      />
                      <span style={{ color: "#618764", fontSize: "0.85rem" }}>to</span>
                      <input
                        type="text"
                        placeholder="17:00"
                        className={styles.input}
                        style={{ width: 80, padding: "6px 10px" }}
                        value={slot.endTime}
                        onChange={(e) => handleSlotChange(slot.dayOfWeek, "endTime", e.target.value)}
                      />
                      <select
                        className={styles.select}
                        style={{ padding: "6px 10px" }}
                        value={slot.slotMins}
                        onChange={(e) => handleSlotChange(slot.dayOfWeek, "slotMins", Number(e.target.value))}
                      >
                        <option value="15">15 min slots</option>
                        <option value="30">30 min slots</option>
                        <option value="45">45 min slots</option>
                        <option value="60">60 min slots</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {saveError && <div style={{ fontSize: "0.82rem", color: "#e03131" }}>{saveError}</div>}
            {saveSuccess && <div style={{ fontSize: "0.82rem", color: "#0ca678", display: "flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} />{saveSuccess}</div>}

            <button type="submit" disabled={savingSlots} className={styles.submitBtn}>
              {savingSlots ? <div className={styles.spinner} /> : "Save Availability Settings"}
            </button>
          </form>
        </div>

        {/* Doctor bookings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Upcoming */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper} style={{ background: "#618764" }}>
                <Video size={18} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Scheduled Consultations</h3>
                <p className={styles.cardSub}>List of patient bookings scheduled with you</p>
              </div>
            </div>

            <div className={styles.appointmentsList}>
              {upcomingAppts.length === 0 ? (
                <div className={styles.emptyState}>
                  <Clock size={32} color="#e5dacd" />
                  <span>No upcoming consultations scheduled.</span>
                </div>
              ) : (
                upcomingAppts.map((appt) => {
                  const callReady = appt.videoSession && isCallEnabled(appt.scheduledAt);
                  return (
                    <div key={appt.id} className={styles.appointmentCard}>
                      <div className={styles.patientInfo}>
                        <div className={styles.avatar}>
                          {appt.patient.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className={styles.patName}>{appt.patient.fullName}</h4>
                          <p className={styles.patMeta}>
                            Blood Group: {appt.patient.bloodGroup || "Not set"}
                          </p>
                          {appt.notes && (
                            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#618764", fontStyle: "italic" }}>
                              "{appt.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className={styles.apptDetails}>
                        <div className={styles.timeWrap}>
                          <Clock size={14} />
                          <span>{formatDate(appt.scheduledAt)}</span>
                        </div>
                        <div>
                          <span className={`${styles.statusBadge} ${
                            appt.status === "SCHEDULED" ? styles.statusScheduled :
                            appt.status === "CONFIRMED" ? styles.statusConfirmed :
                            styles.statusInProgress
                          }`}>
                            {appt.status}
                          </span>
                        </div>
                      </div>

                      <div className={styles.actionsWrap}>
                        {appt.status === "SCHEDULED" && (
                          <button
                            onClick={() => handleConfirmAppt(appt.id)}
                            className={styles.confirmBtn}
                          >
                            Confirm
                          </button>
                        )}

                        {appt.videoSession && (appt.status === "CONFIRMED" || appt.status === "IN_PROGRESS") && (
                          <button
                            onClick={() => router.push(`/call/${appt.videoSession?.roomId}`)}
                            disabled={!callReady}
                            className={styles.joinBtn}
                            title={!callReady ? "Active 10 minutes prior to schedule" : "Join Consultation"}
                          >
                            Start Call
                          </button>
                        )}
                        <button
                          onClick={() => handleCancelClick(appt)}
                          className={styles.cancelBtn}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Past */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper} style={{ background: "#495057", boxShadow: "0 4px 10px rgba(73, 80, 87, 0.2)" }}>
                <FileText size={18} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>History</h3>
                <p className={styles.cardSub}>Past completed or cancelled consultations</p>
              </div>
            </div>

            <div className={styles.appointmentsList}>
              {pastAppts.length === 0 ? (
                <div className={styles.emptyState}>
                  <span>No consultation history found.</span>
                </div>
              ) : (
                pastAppts.map((appt) => (
                  <div key={appt.id} className={styles.appointmentCard} style={{ opacity: 0.8 }}>
                    <div className={styles.patientInfo}>
                      <div className={styles.avatar} style={{ background: "#adb5bd" }}>
                        {appt.patient.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className={styles.patName}>{appt.patient.fullName}</h4>
                        <p className={styles.patMeta}>Blood Group: {appt.patient.bloodGroup || "N/A"}</p>
                      </div>
                    </div>

                    <div className={styles.apptDetails}>
                      <div className={styles.timeWrap}>
                        <Clock size={14} />
                        <span>{formatDate(appt.scheduledAt)}</span>
                      </div>
                      <div>
                        <span className={`${styles.statusBadge} ${
                          appt.status === "COMPLETED" ? styles.statusCompleted : styles.statusCancelled
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                    </div>

                    <div className={styles.actionsWrap}>
                      {appt.status === "COMPLETED" && appt.videoSession && (
                        <button
                          onClick={() => router.push(`/call/${appt.videoSession?.roomId}`)}
                          className={styles.joinBtn}
                          style={{ background: "#495057", boxShadow: "none" }}
                        >
                          Upload Prescription
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancellingAppt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h4 className={styles.modalTitle}>Cancel Consultation</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#618764" }}>
              Are you sure you want to cancel the consultation with <strong>{cancellingAppt.patient.fullName}</strong> on {formatDate(cancellingAppt.scheduledAt)}?
            </p>
            <div className={styles.formGroup}>
              <label className={styles.label}>Reason for cancellation</label>
              <input
                type="text"
                placeholder="E.g., Doctor emergency, clinic timing overlap..."
                className={styles.input}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setCancellingAppt(null)}
                className={styles.modalCancelBtn}
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={!cancelReason.trim() || cancelLoading}
                onClick={handleCancelConfirm}
                className={styles.modalConfirmBtn}
              >
                {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
