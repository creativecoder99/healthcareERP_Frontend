"use client";

import React, { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Check,
  Stethoscope,
  ChevronRight,
  AlertCircle,
  User,
} from "lucide-react";
import { useAuthStore } from "../../../lib/auth-store";
import { apiClient } from "../../../lib/api-client";
import styles from "./call.module.css";

interface Message {
  senderId: string;
  text: string;
  senderName: string;
}

interface MedicineInput {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

export default function CallPage({ params }: { params: Promise<{ roomId: string }> }) {
  const router = useRouter();
  const { roomId } = use(params);

  const { user, accessToken } = useAuthStore();

  // References
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Connection & UI states
  const [appointment, setAppointment] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [peerConnected, setPeerConnected] = useState(false);

  // Toggle states
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Chat states
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Post-call states
  const [callEnded, setCallEnded] = useState(false);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");
  const [medicines, setMedicines] = useState<MedicineInput[]>([
    { name: "", dosage: "", frequency: "", duration: "", notes: "" },
  ]);
  const [submittingPrescription, setSubmittingPrescription] = useState(false);

  useEffect(() => {
    if (!user || !accessToken) {
      router.push("/login");
      return;
    }
    initializeCall();

    return () => {
      cleanupCall();
    };
  }, [roomId, user]);

  const initializeCall = async () => {
    try {
      setLoading(true);
      // 1. Fetch appointment details
      const apptRes = await apiClient.get(`/appointments/${roomId}`);
      if (!apptRes.data?.success) {
        throw new Error("Failed to load appointment details");
      }
      const appt = apptRes.data.data;
      setAppointment(appt);
      setAuthorized(true);

      // 2. Fetch call token & ICE servers config
      const tokenRes = await apiClient.get(`/appointments/${roomId}/video-token`);
      if (!tokenRes.data?.success) {
        throw new Error("Failed to fetch WebRTC video session tokens");
      }
      const { iceServers } = tokenRes.data.data;

      // 3. Get local camera/audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 4. Initialize RTCPeerConnection
      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote tracks
      pc.ontrack = (event) => {
        console.log("Remote track received:", event.streams[0]);
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setPeerConnected(true);
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("video:ice-candidate", { candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("WebRTC Connection State changed:", pc.connectionState);
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          setPeerConnected(false);
        }
      };

      // 5. Connect Socket signaling
      const backendUrl = apiClient.defaults.baseURL || "http://localhost:4000/api/v1";
      const socketUrl = backendUrl.replace("/api/v1", "") + "/video";

      const socket = io(socketUrl, {
        withCredentials: true,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("🔌 Connected to signaling channel");
        socket.emit("video:join", { appointmentId: appt.id, token: accessToken });
      });

      socket.on("video:peer-joined", async () => {
        console.log("👥 Peer joined call room");
        setPeerConnected(true);

        // Doctor acts as Caller: initiates SDP negotiation handshake
        if (user?.role === "DOCTOR") {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("video:offer", { sdp: offer });
        }
      });

      socket.on("video:offer", async (data: { sdp: any }) => {
        console.log("📥 Received SDP Offer");
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("video:answer", { sdp: answer });
      });

      socket.on("video:answer", async (data: { sdp: any }) => {
        console.log("📥 Received SDP Answer");
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      });

      socket.on("video:ice-candidate", async (data: { candidate: any }) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("Error adding remote ICE candidate", e);
        }
      });

      socket.on("video:peer-left", () => {
        console.log("👥 Peer left call room");
        setPeerConnected(false);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      });

      // Text chat message relay event
      socket.on("video:chat-message", (data: Message) => {
        setMessages((prev) => [...prev, data]);
      });

      socket.on("video:error", (data: { message: string }) => {
        alert(data.message);
        cleanupCall();
        router.push(user?.role === "DOCTOR" ? "/doctor/dashboard" : "/patient/dashboard");
      });
    } catch (err: any) {
      console.error("Failed to initialize video call", err);
      alert(err.message || "Failed to start camera or connect to video call.");
      router.push(user?.role === "DOCTOR" ? "/doctor/dashboard" : "/patient/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const cleanupCall = () => {
    // Stop local camera/mic tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close WebRTC Peer Connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Disconnect socket connection
    if (socketRef.current) {
      socketRef.current.emit("video:leave");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleEndCall = () => {
    cleanupCall();
    setCallEnded(true);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    const msg: Message = {
      senderId: user?.id || "",
      text: chatInput.trim(),
      senderName: user?.role === "DOCTOR" ? `Dr. ${appointment?.doctor?.fullName}` : appointment?.patient?.fullName,
    };
    socketRef.current.emit("video:chat-message", msg);
    // Also push to local messages
    setMessages((prev) => [...prev, msg]);
    setChatInput("");
  };

  // Medicine management
  const handleMedChange = (idx: number, field: keyof MedicineInput, value: string) => {
    setMedicines((prev) =>
      prev.map((med, i) => (i === idx ? { ...med, [field]: value } : med))
    );
  };

  const addMedicineRow = () => {
    setMedicines((prev) => [
      ...prev,
      { name: "", dosage: "", frequency: "", duration: "", notes: "" },
    ]);
  };

  const removeMedicineRow = (idx: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    // Filter empty medicines
    const filteredMeds = medicines.filter((m) => m.name.trim() !== "");
    if (filteredMeds.length === 0) {
      alert("Please add at least one medicine.");
      return;
    }

    setSubmittingPrescription(true);
    try {
      const res = await apiClient.post(`/appointments/${appointment.id}/prescription`, {
        medicines: filteredMeds,
        notes: prescriptionNotes.trim(),
      });

      if (res.data?.success) {
        router.push("/doctor/dashboard");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit prescription.");
    } finally {
      setSubmittingPrescription(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span>Connecting to virtual consultation room…</span>
        </div>
      </div>
    );
  }

  if (!authorized || !appointment) {
    return (
      <div className={styles.container} style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
          <AlertCircle size={40} color="#ef4444" />
          <span>Access Denied. You do not have permission to join this call.</span>
        </div>
      </div>
    );
  }

  const otherParticipantName =
    user?.role === "DOCTOR" ? appointment.patient?.fullName : `Dr. ${appointment.doctor?.fullName}`;

  return (
    <div className={styles.container}>
      {/* ─── CallEnded screen ─── */}
      {callEnded && (
        <div className={styles.postCallContainer}>
          <div className={styles.postCallCard}>
            {user?.role === "DOCTOR" ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Stethoscope size={24} color="#16a34a" />
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 750 }}>Compile Prescription</h3>
                </div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>
                  Write a digital prescription for <strong>{appointment.patient?.fullName}</strong>.
                  This will be added automatically to their records vault.
                </p>

                <form onSubmit={handlePrescriptionSubmit} className={styles.prescriptionForm}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div className={styles.medRow} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 6 }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Medicine Name</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Dosage</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Frequency</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>Duration</span>
                      <span></span>
                    </div>

                    {medicines.map((med, idx) => (
                      <div key={idx} className={styles.medRow}>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Paracetamol 650"
                          className={styles.inputField}
                          value={med.name}
                          onChange={(e) => handleMedChange(idx, "name", e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="e.g. 1 tab"
                          className={styles.inputField}
                          value={med.dosage}
                          onChange={(e) => handleMedChange(idx, "dosage", e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="e.g. 1-0-1 (Post meals)"
                          className={styles.inputField}
                          value={med.frequency}
                          onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="e.g. 5 days"
                          className={styles.inputField}
                          value={med.duration}
                          onChange={(e) => handleMedChange(idx, "duration", e.target.value)}
                        />
                        {medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedicineRow(idx)}
                            className={styles.removeMedBtn}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addMedicineRow}
                      className={styles.addMedBtn}
                    >
                      <Plus size={14} /> Add Medicine Row
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8" }}>General Notes/Advice</span>
                    <textarea
                      rows={3}
                      placeholder="e.g., Avoid cold beverages. Warm water gargles twice daily."
                      className={styles.inputField}
                      value={prescriptionNotes}
                      onChange={(e) => setPrescriptionNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPrescription}
                    className={styles.actionBtn}
                  >
                    {submittingPrescription ? "Submitting..." : "Submit & Complete Consultation"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
                  <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(22, 163, 74, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                    <Check size={28} style={{ margin: "auto" }} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 750 }}>Consultation Complete</h3>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "#94a3b8", lineHeight: 1.5 }}>
                    Your video consultation with <strong>Dr. {appointment.doctor?.fullName}</strong> has ended.
                    The doctor is currently compiling your digital prescription, which will appear in your Medical Records vault shortly.
                  </p>
                  <button
                    onClick={() => router.push("/patient/dashboard")}
                    className={styles.actionBtn}
                    style={{ width: "100%", marginTop: 10 }}
                  >
                    Back to Dashboard <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Call layout area ─── */}
      <div className={styles.mainArea}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logo}>
            Medi<span>Core</span> Virtual Consult
          </div>
          <div className={styles.apptInfo}>
            {user!.role === "DOCTOR" ? "Patient: " : "Doctor: "}
            <strong>{otherParticipantName}</strong>
          </div>
        </header>

        {/* Video Screen */}
        <div className={styles.videoContainer}>
          {peerConnected ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={styles.remoteVideo}
            />
          ) : (
            <div className={styles.waitingOverlay}>
              <div className={styles.pulseIcon}>
                <VideoIcon size={28} />
              </div>
              <span style={{ fontSize: "0.95rem", fontWeight: 500, color: "#94a3b8" }}>
                Waiting for {otherParticipantName} to join...
              </span>
            </div>
          )}

          {/* Local camera preview PIP */}
          <div className={styles.localVideoPIP}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={styles.localVideo}
              style={{ display: videoOff ? "none" : "block" }}
            />
            {videoOff && (
              <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#0a0a0e" }}>
                <User size={20} color="#94a3b8" />
              </div>
            )}
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className={styles.toolbar}>
          <button
            onClick={toggleMic}
            className={`${styles.toolButton} ${micMuted ? styles.toolButtonActive : ""}`}
            title={micMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <button
            onClick={toggleVideo}
            className={`${styles.toolButton} ${videoOff ? styles.toolButtonActive : ""}`}
            title={videoOff ? "Start Camera" : "Stop Camera"}
          >
            {videoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
          </button>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={styles.toolButton}
            title="Toggle Chat"
          >
            <MessageSquare size={20} />
          </button>
          <button
            onClick={handleEndCall}
            className={styles.endCallButton}
            title="End Consultation"
          >
            <PhoneOff size={22} />
          </button>
        </div>
      </div>

      {/* ─── Chat panel sidebar ─── */}
      {chatOpen && (
        <aside className={styles.chatSidebar}>
          <div className={styles.chatHeader}>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>Consultation Chat</h4>
          </div>

          <div className={styles.chatMessages}>
            {messages.length === 0 ? (
              <div style={{ margin: "auto", fontSize: "0.8rem", color: "#64748b", textAlign: "center" }}>
                No messages yet. Send a message to get started.
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isSelf = msg.senderId === user!.id;
                return (
                  <div
                    key={idx}
                    className={`${styles.messageBubble} ${
                      isSelf ? styles.messageSelf : styles.messagePeer
                    }`}
                  >
                    {!isSelf && (
                      <div style={{ fontSize: "0.68rem", fontWeight: 700, marginBottom: 2, color: "#a5b4fc" }}>
                        {msg.senderName}
                      </div>
                    )}
                    <div>{msg.text}</div>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.chatInputArea}>
            <input
              type="text"
              placeholder="Type message..."
              className={styles.chatInput}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
            />
            <button onClick={handleSendMessage} className={styles.chatSendBtn}>
              <Send size={15} />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
