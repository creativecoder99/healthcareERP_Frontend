"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  AlertTriangle,
  X,
  ArrowLeft,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { apiClient } from "../../../lib/api-client";
import styles from "./page.module.css";

interface Patient {
  userId: string;
  patientId: string;
  email: string;
  phone: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  heightCm?: number;
  weightKg?: number;
  state: string;
  isSuspended: boolean;
  createdAt: string;
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
  } | null;
}

export default function AdminPatientsCrud() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form states
  const [formFields, setFormFields] = useState({
    email: "",
    phone: "",
    fullName: "",
    dob: "",
    gender: "male",
    bloodGroup: "A+",
    heightCm: "",
    weightKg: "",
    state: "Maharashtra",
  });

  const fetchPatients = async (page = 1) => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/patients", {
        params: {
          page,
          limit: pagination.limit,
          search: search || undefined,
          plan: planFilter || undefined,
        },
      });
      if (res.data?.success) {
        setPatients(res.data.data.patients);
        setPagination(res.data.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load database registries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(1);
  }, [search, planFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPatients(newPage);
    }
  };

  const handleToggleSuspend = async (patient: Patient) => {
    try {
      setActionLoading(true);
      const res = await apiClient.post(`/admin/users/${patient.userId}/suspend`);
      if (res.data?.success) {
        setPatients((prev) =>
          prev.map((p) =>
            p.userId === patient.userId ? { ...p, isSuspended: !p.isSuspended } : p
          )
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to toggle account suspension lock");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = {
        ...formFields,
        heightCm: formFields.heightCm ? Number(formFields.heightCm) : null,
        weightKg: formFields.weightKg ? Number(formFields.weightKg) : null,
        dob: formFields.dob || null,
      };

      const res = await apiClient.post("/admin/patients", payload);
      if (res.data?.success) {
        setIsCreateOpen(false);
        resetForm();
        fetchPatients(1);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create patient record");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      setActionLoading(true);
      const payload = {
        ...formFields,
        heightCm: formFields.heightCm ? Number(formFields.heightCm) : null,
        weightKg: formFields.weightKg ? Number(formFields.weightKg) : null,
        dob: formFields.dob || null,
      };

      const res = await apiClient.put(`/admin/patients/${selectedPatient.userId}`, payload);
      if (res.data?.success) {
        setIsEditOpen(false);
        resetForm();
        fetchPatients(pagination.page);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update patient record");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedPatient) return;
    try {
      setActionLoading(true);
      const res = await apiClient.delete(`/admin/patients/${selectedPatient.userId}`);
      if (res.data?.success) {
        setIsDeleteOpen(false);
        setSelectedPatient(null);
        fetchPatients(pagination.page);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete patient record");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormFields({
      email: patient.email,
      phone: patient.phone,
      fullName: patient.fullName,
      dob: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split("T")[0] : "",
      gender: patient.gender?.toLowerCase() || "male",
      bloodGroup: patient.bloodGroup || "A+",
      heightCm: patient.heightCm ? String(patient.heightCm) : "",
      weightKg: patient.weightKg ? String(patient.weightKg) : "",
      state: patient.state || "Maharashtra",
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormFields({
      email: "",
      phone: "",
      fullName: "",
      dob: "",
      gender: "male",
      bloodGroup: "A+",
      heightCm: "",
      weightKg: "",
      state: "Maharashtra",
    });
    setSelectedPatient(null);
  };

  return (
    <div className={styles.crudContainer}>
      {/* Title & Actions Bar */}
      <section className={styles.crudHeader}>
        <div>
          <h1 className={styles.glowTitle}>SYSOP // PATIENT_TELEMETRY_CRUD</h1>
          <p className={styles.subtext}>Direct database mutations and system-level administrative override access.</p>
        </div>
        <button
          className={styles.primaryBtn}
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
        >
          <UserPlus size={18} />
          <span>INJECT_NEW_PATIENT</span>
        </button>
      </section>

      {/* Query Filter Ribbon */}
      <section className={styles.filterRibbon}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search email, name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">ALL_SUBSCRIPTION_TIERS</option>
          <option value="FREE">FREE TIER</option>
          <option value="BASIC">BASIC PLAN</option>
          <option value="PRO">PRO PLAN</option>
          <option value="FAMILY">FAMILY PLAN</option>
          <option value="PRO_6M">PRO (6 MONTHS)</option>
          <option value="PRO_1Y">PRO (1 YEAR)</option>
        </select>
      </section>

      {/* Database CRUD Table Grid */}
      <section className={styles.tableBlock}>
        {loading ? (
          <div className={styles.loaderWrap}>
            <div className={styles.ring} />
            <span>SYNCING DATAFRAME PROTOCOLS...</span>
          </div>
        ) : error ? (
          <div className={styles.errorBanner}>{error}</div>
        ) : patients.length === 0 ? (
          <div className={styles.emptyState}>No patient database nodes match this query schema.</div>
        ) : (
          <div className={styles.responsiveTable}>
            <table className={styles.crudTable}>
              <thead>
                <tr>
                  <th>PATIENT_IDENTITY</th>
                  <th>TELEMETRY_CONTACT</th>
                  <th>STATE</th>
                  <th>SUBSCRIPTION_PLAN</th>
                  <th>LOCK_STATUS</th>
                  <th>ADMIN_ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.userId} className={p.isSuspended ? styles.suspendedRow : ""}>
                    <td>
                      <div className={styles.idCell}>
                        <div className={styles.patientName}>{p.fullName}</div>
                        <div className={styles.userIdHex}>ID: {p.userId.slice(0, 10)}...</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.contactCell}>
                        <div>{p.email}</div>
                        <div className={styles.phoneLabel}>{p.phone}</div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.stateBadge}>{p.state}</span>
                    </td>
                    <td>
                      {p.subscription ? (
                        <div className={styles.planCell}>
                          <span className={`${styles.planBadge} ${p.subscription.plan === "FREE" ? styles.freeBadge : styles.paidBadge}`}>
                            {p.subscription.plan}
                          </span>
                          <div className={styles.expiryLabel}>
                            Ends: {new Date(p.subscription.currentPeriodEnd).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className={styles.noSubBadge}>NO_SUB_NODE</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.statusLabel} ${p.isSuspended ? styles.statusAlert : styles.statusActive}`}>
                        {p.isSuspended ? "SUSPENDED" : "SYS_ACTIVE"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => openEditModal(p)}
                          title="Edit Registry"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className={`${styles.iconBtn} ${p.isSuspended ? styles.unsuspendBtn : styles.suspendBtn}`}
                          onClick={() => handleToggleSuspend(p)}
                          disabled={actionLoading}
                          title={p.isSuspended ? "Reactivate User" : "Suspend User Account"}
                        >
                          {p.isSuspended ? <UserCheck size={16} /> : <UserX size={16} />}
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles.deleteBtn}`}
                          onClick={() => openDeleteModal(p)}
                          title="Purge Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className={styles.pagination}>
              <span className={styles.pageInfo}>
                RECORDS: {pagination.total} // PAGE {pagination.page} OF {pagination.totalPages}
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

      {/* CRUD MODALS */}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3>INJECT_DATABASE_RECORD // PATIENT</h3>
              <button onClick={() => setIsCreateOpen(false)} className={styles.closeBtn}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className={styles.modalForm}>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>FULL_NAME</label>
                  <input
                    type="text"
                    required
                    value={formFields.fullName}
                    onChange={(e) => setFormFields({ ...formFields, fullName: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label>EMAIL_ADDRESS</label>
                  <input
                    type="email"
                    required
                    value={formFields.email}
                    onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                  />
                </div>
                <div className={styles.formField}>
                  <label>PHONE_NUMBER</label>
                  <input
                    type="text"
                    required
                    value={formFields.phone}
                    placeholder="e.g. +919999999999"
                    onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formRow3}>
                <div className={styles.formField}>
                  <label>DATE_OF_BIRTH</label>
                  <input
                    type="date"
                    value={formFields.dob}
                    onChange={(e) => setFormFields({ ...formFields, dob: e.target.value })}
                  />
                </div>
                <div className={styles.formField}>
                  <label>GENDER</label>
                  <select
                    value={formFields.gender}
                    onChange={(e) => setFormFields({ ...formFields, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-Binary</option>
                    <option value="prefer-not">Prefer Not</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>STATE</label>
                  <input
                    type="text"
                    required
                    value={formFields.state}
                    onChange={(e) => setFormFields({ ...formFields, state: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formRow3}>
                <div className={styles.formField}>
                  <label>BLOOD_GROUP</label>
                  <select
                    value={formFields.bloodGroup}
                    onChange={(e) => setFormFields({ ...formFields, bloodGroup: e.target.value })}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>HEIGHT (CM)</label>
                  <input
                    type="number"
                    value={formFields.heightCm}
                    onChange={(e) => setFormFields({ ...formFields, heightCm: e.target.value })}
                  />
                </div>
                <div className={styles.formField}>
                  <label>WEIGHT (KG)</label>
                  <input
                    type="number"
                    value={formFields.weightKg}
                    onChange={(e) => setFormFields({ ...formFields, weightKg: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <span className={styles.warningNote}>* Initial password will be seeded as Password@123</span>
                <button type="button" onClick={() => setIsCreateOpen(false)} className={styles.cancelBtn}>CANCEL</button>
                <button type="submit" disabled={actionLoading} className={styles.submitBtn}>COMMENCE_WRITE</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3>UPDATE_DATABASE_RECORD // ID: {selectedPatient?.userId.slice(0, 12)}</h3>
              <button onClick={() => setIsEditOpen(false)} className={styles.closeBtn}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className={styles.modalForm}>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>FULL_NAME</label>
                  <input
                    type="text"
                    required
                    value={formFields.fullName}
                    onChange={(e) => setFormFields({ ...formFields, fullName: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label>EMAIL_ADDRESS</label>
                  <input
                    type="email"
                    required
                    value={formFields.email}
                    onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                  />
                </div>
                <div className={styles.formField}>
                  <label>PHONE_NUMBER</label>
                  <input
                    type="text"
                    required
                    value={formFields.phone}
                    onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formRow3}>
                <div className={styles.formField}>
                  <label>DATE_OF_BIRTH</label>
                  <input
                    type="date"
                    value={formFields.dob}
                    onChange={(e) => setFormFields({ ...formFields, dob: e.target.value })}
                  />
                </div>
                <div className={styles.formField}>
                  <label>GENDER</label>
                  <select
                    value={formFields.gender}
                    onChange={(e) => setFormFields({ ...formFields, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-Binary</option>
                    <option value="prefer-not">Prefer Not</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>STATE</label>
                  <input
                    type="text"
                    required
                    value={formFields.state}
                    onChange={(e) => setFormFields({ ...formFields, state: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formRow3}>
                <div className={styles.formField}>
                  <label>BLOOD_GROUP</label>
                  <select
                    value={formFields.bloodGroup}
                    onChange={(e) => setFormFields({ ...formFields, bloodGroup: e.target.value })}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>HEIGHT (CM)</label>
                  <input
                    type="number"
                    value={formFields.heightCm}
                    onChange={(e) => setFormFields({ ...formFields, heightCm: e.target.value })}
                  />
                </div>
                <div className={styles.formField}>
                  <label>WEIGHT (KG)</label>
                  <input
                    type="number"
                    value={formFields.weightKg}
                    onChange={(e) => setFormFields({ ...formFields, weightKg: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsEditOpen(false)} className={styles.cancelBtn}>CANCEL</button>
                <button type="submit" disabled={actionLoading} className={styles.submitBtn}>COMMENCE_UPDATE</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal (Double Confirmation Alert) */}
      {isDeleteOpen && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalBox} ${styles.dangerBox}`}>
            <div className={styles.modalHeader}>
              <div className={styles.dangerTitle}>
                <ShieldAlert size={20} className={styles.alertIcon} />
                <h3>CRITICAL SYSOP TRIGGER: PURGE_RECORD</h3>
              </div>
              <button onClick={() => setIsDeleteOpen(false)} className={styles.closeBtn}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.dangerWarn}>
                WARNING: You are about to initiate a database cascade purge for patient <strong>{selectedPatient?.fullName}</strong>.
              </p>
              <p className={styles.dangerDetail}>
                This action is non-reversible and will permanently delete the User profile, Patient records, active Subscriptions, payment ties, and medical data files from all secure databases.
              </p>
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setIsDeleteOpen(false)} className={styles.cancelBtn}>ABORT</button>
              <button type="button" onClick={handleDeleteSubmit} disabled={actionLoading} className={styles.criticalSubmitBtn}>EXECUTE_FORCE_PURGE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
