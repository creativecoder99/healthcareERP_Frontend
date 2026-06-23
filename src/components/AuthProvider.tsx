"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../lib/auth-store";
import { apiClient } from "../lib/api-client";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        setReady(true);
        return;
      }
      try {
        // Try to get a new access token using the httpOnly refresh cookie
        const refreshRes = await apiClient.post("/auth/refresh");
        const newToken = refreshRes.data?.data?.accessToken;
        if (newToken) {
          useAuthStore.getState().setAccessToken(newToken);
          // Fetch user profile with the new token
          const meRes = await apiClient.get("/auth/me");
          const user = meRes.data?.data?.user;
          if (user) useAuthStore.getState().setUser(user);
        }
      } catch {
        // No valid session — user needs to log in
      } finally {
        setReady(true);
      }
    };

    restoreSession();
  }, []);

  if (!ready) {
    return (
      <div style={{ display: "flex", width: "100vw", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #eef1ec", borderTop: "3px solid #618764", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
