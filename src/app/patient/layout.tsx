"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Activity,
  Stethoscope,
  CreditCard,
  TrendingUp,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "../../lib/auth-store";
import { apiClient } from "../../lib/api-client";
import styles from "./layout.module.css";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = useAuthStore.getState().accessToken;
    const currentUser = useAuthStore.getState().user;
    if (!token || !currentUser) {
      router.push("/login");
    } else if (currentUser.role !== "PATIENT") {
      router.push("/login");
    }
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return (
      <div style={{ display: "flex", width: "100vw", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg-main)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, border: "3px solid var(--color-primary-pale)", borderTop: "3px solid var(--color-primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", fontWeight: 500 }}>Loading MediCore...</span>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/patient/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Medical Records", href: "/patient/records", icon: <FolderOpen size={18} /> },
    { label: "AI Health Chat", href: "/patient/chat", icon: <Sparkles size={18} /> },
    { label: "Analytics", href: "/patient/analytics", icon: <TrendingUp size={18} /> },
    { label: "Appointments", href: "/patient/appointments", icon: <Calendar size={18} /> },
    { label: "My Doctors", href: "/patient/doctors", icon: <Stethoscope size={18} /> },
    { label: "My Profile", href: "/patient/profile", icon: <User size={18} /> },
    { label: "Billing", href: "/patient/settings/billing", icon: <CreditCard size={18} /> },
  ];

  // Get current page header title
  const currentNavItem = navItems.find((item) => pathname?.startsWith(item.href));
  const pageTitle = currentNavItem ? currentNavItem.label : "Patient Portal";

  return (
    <div className={styles.container}>
      {/* Sidebar overlay for mobile */}
      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.overlayActive : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar component */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <Link href="/patient/dashboard" className={styles.sidebarBrand}>
          <div className={styles.brandIcon}>
            <img src="/images/logo_icon.png" alt="MediCore" style={{ width: 20, height: 20, objectFit: "contain" }} />
          </div>
          <span className={styles.brandText}>MediCore</span>
        </Link>

        <nav className={styles.sidebarMenu}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {user.patient?.fullName?.charAt(0) || user.email.charAt(0)}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {user.patient?.fullName || "Patient"}
              </div>
              <div className={styles.userRole}>
                {user.role} Account
              </div>
            </div>
          </div>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <button
              className={styles.menuToggle}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className={styles.headerTitle}>{pageTitle}</h1>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.notificationBadge}>
              <Bell size={20} />
              <span className={styles.badgeDot} />
            </button>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
