// hooks/useAuth.ts — Global auth store (Zustand + persist)
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, setAuthToken } from "../api";
import type { MemberRole, ApprovalStatus } from "../types";

export interface AuthUser {
  id: number;
  first_name: string;
  second_name: string;
  email: string;
  slug: string;
  role: MemberRole;
  approval_status: ApprovalStatus | null;
  assigned_by_researcher_id?: number | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
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
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      loginWithEmail: async (email: string, password: string) => {
        try {
          const res = await apiClient.post("/auth/login", { email, password });
          const { token, user } = res.data;
          // Register token with the interceptor (single source of truth)
          setAuthToken(token);
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
        setAuthToken(null);
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
      // v1: strips the legacy _hasHydrated field that was accidentally persisted.
      // Bumping the version triggers migrate() once for existing users, cleaning
      // their stored data so the race condition cannot recur.
      version: 1,
      migrate: (persisted: any) => ({
        token: persisted?.token ?? null,
        user:  persisted?.user  ?? null,
      }),
      // Only persist what the app needs to restore a session.
      // _hasHydrated must never be stored — it must always start false so
      // ProtectedRoute holds rendering until onRehydrateStorage has run.
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        // Restore the in-memory token BEFORE setting _hasHydrated = true.
        // main.tsx already primes _authToken synchronously, but this keeps
        // the two sources in sync in case of concurrent tab reloads etc.
        if (state?.token) setAuthToken(state.token);
        state?.setHasHydrated(true);
      },
    }
  )
);
