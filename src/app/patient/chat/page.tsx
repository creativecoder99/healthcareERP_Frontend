"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  AlertTriangle,
  X,
  FileText,
  Loader2,
  Brain,
  Activity,
  User,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "../../../lib/api-client";
import { useAuthStore } from "../../../lib/auth-store";
import styles from "./chat.module.css";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  lastMessage: string | null;
}

interface Citation {
  recordId: string;
  fileName: string;
}

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  citations: Citation[] | null;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function ChatPage() {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  
  const [inputValue, setInputValue] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [rateLimitReached, setRateLimitReached] = useState<boolean>(false);
  
  // Document Preview Drawer
  const [previewRecord, setPreviewRecord] = useState<{ id: string; fileName: string; mimeType?: string } | null>(null);
  const [previewSignedUrl, setPreviewSignedUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  // Load Disclaimer Consent State
  useEffect(() => {
    const accepted = localStorage.getItem("medicore_chat_disclaimer_accepted");
    if (accepted === "true") {
      setDisclaimerAccepted(true);
    }
  }, []);

  // Fetch all chat sessions on mount
  useEffect(() => {
    if (disclaimerAccepted) {
      fetchSessions();
    }
  }, [disclaimerAccepted]);

  // Scroll message thread to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await apiClient.get("/chat/sessions");
      if (res.data?.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await apiClient.post("/chat/sessions", { title: "New Conversation" });
      if (res.data?.success) {
        const newSession = res.data.data;
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to create chat session:", err);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    if (isStreaming) return;
    setActiveSessionId(sessionId);
    setLoadingMessages(true);
    setPreviewRecord(null); // Clear preview drawer when switching sessions
    try {
      const res = await apiClient.get(`/chat/sessions/${sessionId}/messages`);
      if (res.data?.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load message history:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendStream = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryText = customQuery || inputValue;
    if (!queryText.trim() || !activeSessionId || isStreaming) return;

    setInputValue("");
    setIsStreaming(true);

    // 1. Add user message locally for instant UI update
    const userMessageId = Math.random().toString();
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: "USER",
      content: queryText,
      citations: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. Add empty assistant message that will be populated by the stream
    const assistantMessageId = Math.random().toString();
    const assistantMsg: ChatMessage = {
      id: assistantMessageId,
      role: "ASSISTANT",
      content: "",
      citations: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`${API_URL}/chat/sessions/${activeSessionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: queryText }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimitReached(true);
          // Remove local mock messages on failure
          setMessages((prev) => prev.slice(0, -2));
          setIsStreaming(false);
          return;
        }
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to stream message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Null stream body reader");

      let completeText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Maintain the last incomplete line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const dataObj = JSON.parse(dataStr);
              if (dataObj.text) {
                completeText += dataObj.text;
                // Update assistant message content in state
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId ? { ...msg, content: completeText } : msg
                  )
                );
              }
            } catch (err) {
              console.warn("Parse error for chunk:", dataStr, err);
            }
          }
        }
      }

      // Re-fetch sessions list to update preview snippets and title
      fetchSessions();
      // Re-fetch final message logs to receive actual database records (including citations)
      const finalMsgRes = await apiClient.get(`/chat/sessions/${activeSessionId}/messages`);
      if (finalMsgRes.data?.success) {
        setMessages(finalMsgRes.data.data);
      }
    } catch (err: any) {
      console.error("Streaming failed:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "⚠️ Sorry, there was an issue processing your request. Please try again." }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCitationClick = async (recordId: string, fileName: string) => {
    setLoadingPreview(true);
    setPreviewRecord({ id: recordId, fileName });
    setPreviewSignedUrl(null);
    try {
      // Fetch details to find mimeType
      const recordRes = await apiClient.get(`/records/${recordId}`);
      let mimeType = "application/pdf";
      if (recordRes.data?.success && recordRes.data.data) {
        mimeType = recordRes.data.data.mimeType;
        setPreviewRecord({ id: recordId, fileName, mimeType });
      }

      // Fetch Signed URL
      const urlRes = await apiClient.get(`/records/${recordId}/signed-url`);
      if (urlRes.data?.success && urlRes.data.data.signedUrl) {
        setPreviewSignedUrl(urlRes.data.data.signedUrl);
      }
    } catch (err) {
      console.error("Failed to load citation file preview:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const formatMessageContent = (content: string) => {
    if (!content) return "";

    const paragraphs = content.split("\n\n");
    return paragraphs.map((p, pIdx) => {
      // Bullet list item check
      if (p.trim().startsWith("- ") || p.trim().startsWith("* ")) {
        const items = p.split("\n");
        return (
          <ul key={pIdx} style={{ paddingLeft: "20px", margin: "8px 0", listStyleType: "disc" }}>
            {items.map((item, itemIdx) => {
              const cleanItem = item.replace(/^[-*]\s+/, "");
              return <li key={itemIdx} style={{ marginBottom: "4px" }}>{parseBold(cleanItem)}</li>;
            })}
          </ul>
        );
      }

      // Numbered list check
      if (/^\d+\.\s+/.test(p.trim())) {
        const items = p.split("\n");
        return (
          <ol key={pIdx} style={{ paddingLeft: "20px", margin: "8px 0", listStyleType: "decimal" }}>
            {items.map((item, itemIdx) => {
              const cleanItem = item.replace(/^\d+\.\s+/, "");
              return <li key={itemIdx} style={{ marginBottom: "4px" }}>{parseBold(cleanItem)}</li>;
            })}
          </ol>
        );
      }

      // Safe paragraphs with linebreaks
      const lines = p.split("\n");
      return (
        <p key={pIdx} style={{ margin: "8px 0", lineHeight: "1.6" }}>
          {lines.map((line, lineIdx) => (
            <React.Fragment key={lineIdx}>
              {lineIdx > 0 && <br />}
              {parseBold(line)}
            </React.Fragment>
          ))}
        </p>
      );
    });
  };

  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const handleAgreeDisclaimer = () => {
    localStorage.setItem("medicore_chat_disclaimer_accepted", "true");
    setDisclaimerAccepted(true);
  };

  // Sample queries for landing workspace
  const QUICK_PROMPTS = [
    "What parameters are tracked in my last blood report?",
    "Explain TSH thyroid levels in plain English.",
    "Do any parameters in my reports show abnormal values?",
    "Summarize the general health biomarkers from my vault.",
  ];

  return (
    <div className={styles.workspace}>
      {/* ─── SIDEBAR SESSIONS PANEL ─── */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.newChatBtn} onClick={handleCreateSession} disabled={isStreaming}>
            <Plus size={16} />
            <span className={styles.sidebarText}>New Chat</span>
          </button>
        </div>

        <div className={styles.sessionList}>
          {loadingSessions ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
              <Loader2 size={20} className="animate-spin" color="var(--color-primary)" />
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
              No chats yet. Start a new session above!
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = activeSessionId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className={`${styles.sessionItem} ${isActive ? styles.sessionItemActive : ""}`}
                  disabled={isStreaming}
                >
                  <span className={styles.sessionTitle}>{s.title || "Conversation"}</span>
                  <span className={styles.sessionPreview}>{s.lastMessage || "No messages yet"}</span>
                  <div className={styles.sessionMeta}>
                    <span>{new Date(s.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── MAIN CHAT AREA ─── */}
      <div className={styles.chatPane}>
        {!disclaimerAccepted ? (
          <div className={styles.landingView}>
            <div className={styles.landingLogoWrap}>
              <img src="/images/logo_icon.png" alt="MediCore AI" style={{ width: 44, height: 44, objectFit: "contain" }} />
            </div>
            <h2 className={styles.landingTitle}>MediCore AI Health Assistant</h2>
            <p className={styles.landingText}>
              Grounded strictly in your uploaded laboratory reports, the chatbot will answer queries, explain
              complex clinical metrics in plain English, and provide clickable citations directly linking back to your
              vault sheets.
            </p>

            <div className={styles.disclaimerCard}>
              <div className={styles.disclaimerHeader}>
                <AlertTriangle size={18} />
                <span>AI Health Disclaimer Required</span>
              </div>
              <p className={styles.disclaimerText}>
                This AI tool provides educational explanations and general informational insights strictly based on
                your uploaded records. **MediCore AI does not diagnose illnesses, prescribe medications, or replace the
                clinical judgment of qualified physicians.**
                By proceeding, you acknowledge that you will not use this information for self-diagnosis and will
                consult a healthcare provider for medical concerns.
              </p>
              <button className={styles.agreeBtn} onClick={handleAgreeDisclaimer}>
                I Understand &amp; Agree
              </button>
            </div>
          </div>
        ) : !activeSessionId ? (
          <div className={styles.landingView}>
            <div className={styles.landingLogoWrap}>
              <img src="/images/logo_icon.png" alt="MediCore AI" style={{ width: 44, height: 44, objectFit: "contain" }} />
            </div>
            <h2 className={styles.landingTitle}>Welcome to MediCore AI</h2>
            <p className={styles.landingText}>
              Select an existing chat session from the sidebar or click **"New Chat"** to begin analyzing your medical records.
            </p>

            <div className={styles.quickPrompts}>
              {QUICK_PROMPTS.map((promptText, idx) => (
                <button
                  key={idx}
                  className={styles.promptCard}
                  onClick={async () => {
                    // Create session and send prompt
                    try {
                      const res = await apiClient.post("/chat/sessions", { title: "New Conversation" });
                      if (res.data?.success) {
                        const newSession = res.data.data;
                        setSessions((prev) => [newSession, ...prev]);
                        setActiveSessionId(newSession.id);
                        setMessages([]);
                        // Stream custom query
                        setTimeout(() => {
                          handleSendStream(undefined, promptText);
                        }, 100);
                      }
                    } catch (err) {
                      console.error("Failed to execute quick prompt:", err);
                    }
                  }}
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.activeChat}>
            {/* Header */}
            <div className={styles.chatHeader}>
              <span className={styles.chatHeaderTitle}>
                {sessions.find((s) => s.id === activeSessionId)?.title || "AI Conversation"}
              </span>
              <span className={styles.rateLimitBadge}>Free Account: 30 daily queries limit</span>
            </div>

            {/* Message Thread */}
            <div className={styles.messageList}>
              {loadingMessages ? (
                <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
                </div>
              ) : (
                <>
                  {messages.map((m) => {
                    const isUser = m.role === "USER";
                    return (
                      <div
                        key={m.id}
                        className={`${styles.messageWrap} ${isUser ? styles.userWrap : styles.assistantWrap}`}
                      >
                        <div className={`${styles.messageBubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
                          {isUser ? m.content : formatMessageContent(m.content)}

                          {/* Citations section */}
                          {!isUser && m.citations && m.citations.length > 0 && (
                            <div className={styles.citationsList}>
                              <div className={styles.citationTitle}>Cited Reports:</div>
                              {m.citations.map((cit, cIdx) => (
                                <button
                                  key={cIdx}
                                  className={styles.citationChip}
                                  onClick={() => handleCitationClick(cit.recordId, cit.fileName)}
                                >
                                  <FileText size={12} />
                                  <span>{cit.fileName}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className={`${styles.messageTime} ${isUser ? styles.userTime : styles.assistantTime}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                  {isStreaming && messages[messages.length - 1]?.role === "USER" && (
                    <div className={`${styles.messageWrap} ${styles.assistantWrap}`}>
                      <div className={`${styles.messageBubble} ${styles.assistantBubble}`}>
                        <div className={styles.typingIndicator}>
                          <div className={styles.typingDot} />
                          <div className={styles.typingDot} />
                          <div className={styles.typingDot} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Form Area */}
            <div className={styles.inputArea}>
              <form className={styles.inputForm} onSubmit={handleSendStream}>
                <textarea
                  className={styles.chatInput}
                  placeholder="Ask a question about your reports..."
                  rows={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendStream();
                    }
                  }}
                  disabled={isStreaming}
                />
                <button type="submit" className={styles.sendBtn} disabled={isStreaming || !inputValue.trim()}>
                  <Send size={16} />
                </button>
              </form>
              <div className={styles.disclaimerFooter}>
                MediCore AI provides record-grounded analysis. Always consult your clinic for health decisions.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── SIDE-BY-SIDE PREVIEW DRAWER (SLIDES IN BESIDE CHAT WORKSPACE) ─── */}
      {previewRecord && (
        <div className={styles.previewDrawer}>
          <div className={styles.drawerHeader}>
            <span className={styles.drawerTitle}>Reference: {previewRecord.fileName}</span>
            <button className={styles.closeDrawerBtn} onClick={() => setPreviewRecord(null)}>
              <X size={18} />
            </button>
          </div>
          <div className={styles.drawerBody}>
            {loadingPreview ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Loading report preview...</span>
              </div>
            ) : previewSignedUrl ? (
              previewRecord.mimeType === "application/pdf" ? (
                <iframe
                  src={`${previewSignedUrl}#toolbar=0`}
                  className={styles.previewFrame}
                  title={previewRecord.fileName}
                />
              ) : previewRecord.mimeType?.startsWith("image/") ? (
                <img src={previewSignedUrl} alt={previewRecord.fileName} className={styles.previewImage} />
              ) : (
                <div style={{ padding: 24, textAlign: "center" }}>
                  <FileText size={48} color="var(--color-text-muted)" style={{ margin: "0 auto 12px" }} />
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-body)", display: "block", marginBottom: 16 }}>
                    No inline preview available for this document format.
                  </span>
                  <a
                    href={previewSignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.agreeBtn}
                    style={{ textDecoration: "none", display: "inline-block", padding: "8px 16px" }}
                  >
                    Download File
                  </a>
                </div>
              )
            ) : (
              <div style={{ padding: 20, textAlign: "center", color: "red", fontSize: "0.85rem" }}>
                Failed to load document preview. Please download manually.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── RATE LIMIT MODAL DIALOG ─── */}
      {rateLimitReached && (
        <div className={styles.rateLimitDialog}>
          <div className={styles.rateLimitBox}>
            <AlertTriangle size={48} color="#f59e0b" style={{ margin: "0 auto 16px" }} />
            <h3 className={styles.rateLimitTitle}>Daily Limit Reached</h3>
            <p className={styles.rateLimitText}>
              Patients on the **Free** subscription tier have a strict limit of 30 AI queries per day.
              Upgrade to the **Pro** or **Family** plan today to get unlimited real-time chat insights.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Link href="/patient/settings/billing" className={styles.upgradeBtn} onClick={() => setRateLimitReached(false)}>
                Upgrade to Pro Plan
              </Link>
              <button className={styles.dismissBtn} onClick={() => setRateLimitReached(false)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
