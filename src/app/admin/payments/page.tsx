"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  RotateCcw,
  AlertTriangle,
  X,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import styles from "./page.module.css";

interface Payment {
  id: string;
  amount: number;
  status: string;
  provider: string;
  providerPaymentId?: string;
  razorpayOrderId?: string;
  paidAt?: string;
  createdAt: string;
  user?: {
    userId: string;
    email: string;
    role: string;
    name: string;
  } | null;
  subscription?: {
    id: string;
    plan: string;
    status: string;
  } | null;
}

export default function AdminPaymentsLedger() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/payments", {
        params: {
          page,
          limit: pagination.limit,
          status: statusFilter || undefined,
        },
      });
      if (res.data?.success) {
        setPayments(res.data.data.payments);
        setPagination(res.data.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to query payments repository");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, [statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPayments(newPage);
    }
  };

  const handleRefundSubmit = async () => {
    if (!selectedPayment) return;
    try {
      setActionLoading(true);
      const res = await apiClient.post(`/admin/payments/${selectedPayment.id}/refund`);
      if (res.data?.success) {
        setPayments((prev) =>
          prev.map((p) =>
            p.id === selectedPayment.id ? { ...p, status: "REFUNDED" } : p
          )
        );
        setIsRefundOpen(false);
        setSelectedPayment(null);
        alert("Refund processed successfully and client plan reverted to FREE");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to process refund request");
    } finally {
      setActionLoading(false);
    }
  };

  const openRefundModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsRefundOpen(true);
  };

  return (
    <div className={styles.ledgerContainer}>
      {/* Title Header */}
      <section className={styles.ledgerHeader}>
        <div>
          <h1 className={styles.glowTitle}>SYSOP // BILLING_LEDGER_AUDIT</h1>
          <p className={styles.subtext}>Financial transactions audits, payment tracking, and direct customer invoice refunds.</p>
        </div>
      </section>

      {/* Query Filter Ribbon */}
      <section className={styles.filterRibbon}>
        <div className={styles.planGauges}>
          <div className={styles.gaugeBlock}>
            <DollarSign size={16} className={styles.greenText} />
            <span>GATEWAY_STATUS: ACTIVE</span>
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">ALL_TRANSACTION_STATUSES</option>
          <option value="SUCCEEDED">SUCCEEDED (PAID)</option>
          <option value="REFUNDED">REFUNDED</option>
          <option value="FAILED">FAILED</option>
          <option value="PENDING">PENDING</option>
        </select>
      </section>

      {/* Database ledger table */}
      <section className={styles.tableBlock}>
        {loading ? (
          <div className={styles.loaderWrap}>
            <div className={styles.ring} />
            <span>RESTRICTION PROTOCOLS SYNCING...</span>
          </div>
        ) : error ? (
          <div className={styles.errorBanner}>{error}</div>
        ) : payments.length === 0 ? (
          <div className={styles.emptyState}>No billing logs found matching this transaction schema.</div>
        ) : (
          <div className={styles.responsiveTable}>
            <table className={styles.ledgerTable}>
              <thead>
                <tr>
                  <th>TRANSACTION_ID // DATE</th>
                  <th>CLIENT_IDENTIFIER</th>
                  <th>AMOUNT (INR)</th>
                  <th>ORDER_IDS // PROVIDER</th>
                  <th>STATUS</th>
                  <th>SYSOP_MUTATIONS</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.idCell}>
                        <div className={styles.paymentId}>ID: {p.id.slice(0, 14)}...</div>
                        <div className={styles.dateLabel}>
                          {p.paidAt ? new Date(p.paidAt).toLocaleString() : new Date(p.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td>
                      {p.user ? (
                        <div className={styles.userCell}>
                          <div className={styles.userName}>{p.user.name}</div>
                          <div className={styles.userSubLabel}>
                            {p.user.email} <span className={styles.roleSub}>({p.user.role})</span>
                          </div>
                        </div>
                      ) : (
                        <span className={styles.noUserLabel}>ORPHANED_NODE</span>
                      )}
                    </td>
                    <td>
                      <span className={styles.amountText}>₹{(p.amount).toFixed(2)}</span>
                    </td>
                    <td>
                      <div className={styles.providerCell}>
                        <div>{p.providerPaymentId || "N/A"}</div>
                        <div className={styles.orderLabel}>Order: {p.razorpayOrderId || "N/A"}</div>
                        <div className={styles.providerType}>{p.provider.toUpperCase()}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusLabel} ${
                        p.status === "SUCCEEDED" ? styles.statusSucceeded :
                        p.status === "REFUNDED" ? styles.statusRefunded :
                        p.status === "FAILED" ? styles.statusFailed : styles.statusPending
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.refundBtn}
                        disabled={p.status !== "SUCCEEDED" || actionLoading}
                        onClick={() => openRefundModal(p)}
                        title="Process Refund"
                      >
                        <RotateCcw size={14} />
                        <span>PROCESS_REFUND</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className={styles.pagination}>
              <span className={styles.pageInfo}>
                TRANSACTIONS: {pagination.total} // PAGE {pagination.page} OF {pagination.totalPages}
              </span>
              <div className={styles.pageButtons}>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={styles.pageBtn}
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={styles.pageBtn}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Refund Modal */}
      {isRefundOpen && selectedPayment && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <div className={styles.refundTitle}>
                <AlertTriangle size={20} className={styles.warningIcon} />
                <h3>SYSOP // COMMENCE_REFUND_PROTOCOL</h3>
              </div>
              <button onClick={() => setIsRefundOpen(false)} className={styles.closeBtn}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.refundWarn}>
                Are you sure you want to authorize a refund of <strong>₹{selectedPayment.amount.toFixed(2)}</strong> for client <strong>{selectedPayment.user?.name}</strong>?
              </p>
              <div className={styles.detailsBlock}>
                <div className={styles.detailRow}><span>Payment Gateway Reference:</span> <strong>{selectedPayment.providerPaymentId}</strong></div>
                <div className={styles.detailRow}><span>Razorpay Order ID:</span> <strong>{selectedPayment.razorpayOrderId}</strong></div>
                <div className={styles.detailRow}><span>Target User Account:</span> <strong>{selectedPayment.user?.email}</strong></div>
              </div>
              <p className={styles.noteLabel}>
                * Authorizing this refund will request a chargeback in Razorpay and downgrade the client subscription node immediately back to the FREE plan.
              </p>
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setIsRefundOpen(false)} className={styles.cancelBtn}>ABORT</button>
              <button type="button" onClick={handleRefundSubmit} disabled={actionLoading} className={styles.submitBtn}>COMMENCE_REFUND</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
