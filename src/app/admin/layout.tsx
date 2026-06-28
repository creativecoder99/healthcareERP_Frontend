"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  LogOut,
  Bell,
  Activity,
  Terminal
} from "lucide-react";
import { useAuthStore } from "../../lib/auth-store";
import { apiClient } from "../../lib/api-client";
import styles from "./layout.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
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
    } else if (currentUser.role !== "PLATFORM_ADMIN") {
      // Redirect unauthorized users
      router.push("/login");
    }
  }, [mounted, user, router]);

  if (!mounted || !user || user.role !== "PLATFORM_ADMIN") {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingPulse}>
          <Activity size={32} className={styles.loadingIcon} />
          <span>AUTHENTICATING SECURE SYSOP NODE...</span>
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
    { label: "Console", href: "/admin", icon: <LayoutDashboard size={20} /> },
    { label: "Patients", href: "/admin/patients", icon: <Users size={20} /> },
    { label: "Ledger", href: "/admin/payments", icon: <CreditCard size={20} /> },
  ];

  return (
    <div className={styles.adminShell}>
      {/* Background Neon Grid Accent */}
      <div className={styles.gridOverlay} />
      <div className={styles.glowRadial} />

      {/* Top Header Status bar */}
      <header className={styles.topStatus}>
        <div className={styles.sysTitle}>
          <Terminal size={18} className={styles.terminalIcon} />
          <span className={styles.pulseDot} />
          <span className={styles.textGlow}>MEDICORE // CORE_SYSOP_NODE_V1.0</span>
        </div>
        <div className={styles.sysMeta}>
          <div className={styles.adminBadge}>ADMIN CONFIRMATION SECURE</div>
          <span className={styles.metaDivider}>|</span>
          <span className={styles.adminEmail}>{user.email}</span>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className={styles.panelContent}>
        {children}
      </main>

      {/* Floating HUD Bottom Dock (macos style cockpit layout) */}
      <div className={styles.hudDockWrapper}>
        <nav className={styles.hudDock}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.dockItem} ${isActive ? styles.dockItemActive : ""}`}
                title={item.label}
              >
                <div className={styles.iconGlow}>{item.icon}</div>
                <span className={styles.dockLabel}>{item.label}</span>
              </Link>
            );
          })}
          
          <div className={styles.dockDivider} />

          <button className={styles.dockSignOut} onClick={handleSignOut} title="Sign Out">
            <LogOut size={20} />
            <span className={styles.dockLabel}>Log Out</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
