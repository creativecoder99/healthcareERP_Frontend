import { create } from "zustand";

interface UserProfile {
  id: string;
  email: string;
  phone: string;
  role: "PATIENT" | "DOCTOR" | "ORG_ADMIN" | "PLATFORM_ADMIN";
  patient?: any;
  doctor?: any;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  setUser: (user: UserProfile | null) => void;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  setUser: (user) => set({ user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
  isAuthenticated: () => !!get().accessToken,
}));
