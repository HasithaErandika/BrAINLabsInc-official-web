// ─────────────────────────────────────────────────────────────────────────────
// useAuth.ts — Global auth store using zustand.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient } from "../lib/api";
import type { MemberRole, ApprovalStatus } from "../lib/api";

export interface AuthUser {
  id: number;
  first_name: string;
  second_name: string;
  email: string;
  slug: string;
  role: MemberRole;
  approval_status: ApprovalStatus | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loginWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  updateUser: (updates: Partial<AuthUser>) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isResearcher: () => boolean;
  isAssistant: () => boolean;
  refreshUser: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      loginWithEmail: async (email: string, password: string) => {
        try {
          const res = await apiClient.post("/auth/login", { email, password });
          const { token, user } = res.data;

          // Store token explicitly for the apiClient interceptor
          localStorage.setItem('brain_labs_token', token);

          set({ token, user });
          return { error: null };
        } catch (err: any) {
          return { error: err.response?.data?.error || err.message || "Login failed" };
        }
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      logout: () => {
        localStorage.removeItem('brain_labs_token');
        set({ user: null, token: null });
      },

      isAdmin: () => get().user?.role === "admin",
      isResearcher: () => get().user?.role === "researcher",
      isAssistant: () => get().user?.role === "research_assistant",

      refreshUser: async () => {
        try {
          const res = await apiClient.get("/me");
          set({ user: res.data });
        } catch (err) {
          console.error("Failed to refresh user", err);
        }
      },
    }),
    {
      name: "brain_labs_auth",
    }
  )
);
