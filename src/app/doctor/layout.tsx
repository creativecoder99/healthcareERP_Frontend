"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Activity,
} from "lucide-react";
import { useAuthStore } from "../../lib/auth-store";
import { apiClient } from "../../lib/api-client";
import styles from "./layout.module.css";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
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
    } else if (currentUser.role !== "DOCTOR") {
      router.push("/login");
    }
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return (
      <div style={{ display: "flex", width: "100vw", height: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#fcfaf7" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, border: "3px solid #dcfce7", borderTop: "3px solid #16a34a", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: "0.9rem", color: "#6b7280", fontWeight: 500 }}>Loading MediCore...</span>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/doctor/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "My Patients", href: "/doctor/patients", icon: <Users size={18} /> },
    { label: "My Profile", href: "/doctor/profile", icon: <User size={18} /> },
  ];

  const currentNavItem = navItems.find((item) => pathname?.startsWith(item.href));
  const pageTitle = currentNavItem ? currentNavItem.label : "Doctor Portal";

  return (
    <div className={styles.container}>
      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.overlayActive : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <Link href="/doctor/dashboard" className={styles.sidebarBrand}>
          <div className={styles.brandIcon}>
            <Activity size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span className={styles.brandText}>MediCore</span>
          <span className={styles.brandBadge}>Doctor</span>
        </Link>

        <nav className={styles.sidebarMenu}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/doctor/dashboard" && pathname?.startsWith(item.href));
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
              {user.doctor?.fullName?.charAt(0) || user.email.charAt(0)}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {user.doctor?.fullName ? `Dr. ${user.doctor.fullName}` : "Doctor"}
              </div>
              <div className={styles.userRole}>Doctor Account</div>
            </div>
          </div>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <button className={styles.menuToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
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
