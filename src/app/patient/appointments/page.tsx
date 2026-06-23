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
  Trash2,
  CheckCircle,
} from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import styles from "./appointments.module.css";

interface Doctor {
  id: string;
  fullName: string;
  specialisation: string;
  avatarUrl: string | null;
}

interface LinkItem {
  id: string;
  status: string;
  doctor: Doctor;
}

interface Appointment {
  id: string;
  scheduledAt: string;
  durationMins: number;
  status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes: string | null;
  cancelReason: string | null;
  doctor: {
    fullName: string;
    specialisation: string;
    avatarUrl: string | null;
  };
  videoSession: {
    roomId: string;
    status: string;
  } | null;
  prescriptions?: any[];
}

interface DayAvailability {
  date: string;
  slots: string[];
}

export default function PatientAppointmentsPage() {
  const router = useRouter();

  // Data states
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking states
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  // Cancel states
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Date strip helper
  const [datesStrip, setDatesStrip] = useState<{ dayName: string; dateStr: string; label: string }[]>([]);

  useEffect(() => {
    // Generate dates strip for next 7 days
    const list = [];
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      list.push({
        dayName: weekdays[d.getDay()]!,
        dateStr: `${yyyy}-${mm}-${dd}`,
        label: String(d.getDate()),
      });
    }
    setDatesStrip(list);
    setSelectedDateStr(list[0]?.dateStr || "");

    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [linksRes, apptsRes] = await Promise.all([
        apiClient.get("/links"),
        apiClient.get("/appointments"),
      ]);

      if (linksRes.data?.success) {
        // Only allow APPROVED doctor links
        const approved = linksRes.data.data.filter((l: any) => l.status === "APPROVED");
        setLinks(approved);
      }
      if (apptsRes.data?.success) {
        setAppointments(apptsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch availability when doctor selection changes
  useEffect(() => {
    if (!selectedDoctorId) {
      setAvailability([]);
      setSelectedSlot("");
      return;
    }

    const fetchAvailability = async () => {
      try {
        const start = datesStrip[0]?.dateStr;
        const end = datesStrip[datesStrip.length - 1]?.dateStr;
        const res = await apiClient.get(
          `/appointments/doctor/${selectedDoctorId}/availability?startDate=${start}&endDate=${end}`
        );
        if (res.data?.success) {
          setAvailability(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load availability", err);
      }
    };

    fetchAvailability();
  }, [selectedDoctorId, datesStrip]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError("");
    setBookingSuccess("");

    if (!selectedDoctorId || !selectedSlot) {
      setBookingError("Please select a doctor and time slot.");
      return;
    }

    setBookingLoading(true);
    try {
      const res = await apiClient.post("/appointments", {
        doctorId: selectedDoctorId,
        scheduledAt: selectedSlot,
        notes: bookingNotes,
      });

      if (res.data?.success) {
        setBookingSuccess("Appointment booked successfully!");
        setSelectedDoctorId("");
        setSelectedSlot("");
        setBookingNotes("");
        // Reload appointments list
        const apptsRes = await apiClient.get("/appointments");
        if (apptsRes.data?.success) {
          setAppointments(apptsRes.data.data);
        }
      }
    } catch (err: any) {
      setBookingError(err.response?.data?.message || "Failed to book appointment.");
    } finally {
      setBookingLoading(false);
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
        // Reload appointments list
        const apptsRes = await apiClient.get("/appointments");
        if (apptsRes.data?.success) {
          setAppointments(apptsRes.data.data);
        }
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

  const activeDateAvailability = availability.find((a) => a.date === selectedDateStr);
  const activeSlots = activeDateAvailability ? activeDateAvailability.slots : [];

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
          <div style={{ width: 32, height: 32, border: "3px solid #e0e7ff", borderTop: "3px solid #d35400", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: "0.85rem", color: "#a08060", fontWeight: 500 }}>Loading scheduling client…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>
        {/* Book appointment */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <CalendarIcon size={18} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Schedule Consultation</h3>
              <p className={styles.cardSub}>Book a virtual consultation slot with your doctor</p>
            </div>
          </div>

          <form onSubmit={handleBook} className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Doctor</label>
              <select
                className={styles.select}
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              >
                <option value="">-- Choose Doctor --</option>
                {links.map((link) => (
                  <option key={link.doctor.id} value={link.doctor.id}>
                    Dr. {link.doctor.fullName} ({link.doctor.specialisation || "General Practice"})
                  </option>
                ))}
              </select>
            </div>

            {selectedDoctorId && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Select Date</label>
                  <div className={styles.dateStrip}>
                    {datesStrip.map((item) => (
                      <button
                        key={item.dateStr}
                        type="button"
                        className={`${styles.dateButton} ${
                          selectedDateStr === item.dateStr ? styles.dateButtonActive : ""
                        }`}
                        onClick={() => {
                          setSelectedDateStr(item.dateStr);
                          setSelectedSlot("");
                        }}
                      >
                        <span className={styles.dateDay}>{item.dayName}</span>
                        <span className={styles.dateVal}>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Available Slots</label>
                  {activeSlots.length === 0 ? (
                    <div style={{ fontSize: "0.85rem", color: "#a08060", padding: "10px 0" }}>
                      No available booking slots on this date.
                    </div>
                  ) : (
                    <div className={styles.slotsGrid}>
                      {activeSlots.map((slot) => {
                        const dateObj = new Date(slot);
                        const displayTime = dateObj.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        return (
                          <button
                            key={slot}
                            type="button"
                            className={`${styles.slotButton} ${
                              selectedSlot === slot ? styles.slotButtonActive : ""
                            }`}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            {displayTime}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Reason/Notes for Doctor</label>
                  <textarea
                    rows={3}
                    placeholder="E.g., Follow up on thyroid blood test results..."
                    className={styles.input}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                  />
                </div>
              </>
            )}

            {bookingError && <div style={{ fontSize: "0.82rem", color: "#e03131" }}>{bookingError}</div>}
            {bookingSuccess && <div style={{ fontSize: "0.82rem", color: "#0ca678", display: "flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} />{bookingSuccess}</div>}

            <button
              type="submit"
              disabled={!selectedDoctorId || !selectedSlot || bookingLoading}
              className={styles.submitBtn}
            >
              {bookingLoading ? <div className={styles.spinner} /> : "Confirm Consultation"}
            </button>
          </form>
        </div>

        {/* List Appointments */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Upcoming */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper} style={{ background: "#1098ad", boxShadow: "0 4px 10px rgba(16, 152, 173, 0.2)" }}>
                <Video size={18} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Upcoming Consultations</h3>
                <p className={styles.cardSub}>List of your scheduled video consult appointments</p>
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
                      <div className={styles.doctorInfo}>
                        <div className={styles.avatar}>
                          {appt.doctor.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className={styles.docName}>Dr. {appt.doctor.fullName}</h4>
                          <p className={styles.docMeta}>{appt.doctor.specialisation || "General Practice"}</p>
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
                        {appt.videoSession && (
                          <button
                            onClick={() => router.push(`/call/${appt.videoSession?.roomId}`)}
                            disabled={!callReady}
                            className={styles.joinBtn}
                            title={!callReady ? "Active 10 minutes prior to schedule" : "Join Consultation"}
                          >
                            Join Call
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
                <p className={styles.cardSub}>Past, completed or cancelled consultations</p>
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
                    <div className={styles.doctorInfo}>
                      <div className={styles.avatar} style={{ background: "#adb5bd" }}>
                        {appt.doctor.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className={styles.docName}>Dr. {appt.doctor.fullName}</h4>
                        <p className={styles.docMeta}>{appt.doctor.specialisation}</p>
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
                      {appt.prescriptions && appt.prescriptions.length > 0 && (
                        <button
                          onClick={() => router.push("/patient/records")}
                          className={styles.joinBtn}
                          style={{ background: "#495057", boxShadow: "none" }}
                        >
                          View Prescription
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
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#a08060" }}>
              Are you sure you want to cancel your consultation with <strong>Dr. {cancellingAppt.doctor.fullName}</strong> on {formatDate(cancellingAppt.scheduledAt)}?
            </p>
            <div className={styles.formGroup}>
              <label className={styles.label}>Reason for cancellation</label>
              <input
                type="text"
                placeholder="E.g., Rescheduling, doctor schedule clash, emergency..."
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
