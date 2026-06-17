import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { UserProfile } from "./types";
import { wireSession } from "./http";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => {
        const store: AuthState = {
          accessToken: null,
          refreshToken: null,
          user: null,

          setTokens: (access, refresh) => {
            set({ accessToken: access, refreshToken: refresh });
          },

          setUser: (user) => set({ user }),

          logout: () => {
            set({ accessToken: null, refreshToken: null, user: null });
            if (typeof window !== "undefined") {
              window.location.href = "/";
            }
          },

          isAuthenticated: () => Boolean(get().accessToken),
        };

        wireSession(
          () => ({ access: get().accessToken, refresh: get().refreshToken }),
          (access, refresh) => get().setTokens(access, refresh),
          () => get().logout(),
        );

        return store;
      },
      {
        name: "expressforge-auth",
        partialize: (state) => ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          // Persist user so nav shows email immediately after refresh
          user: state.user,
        }),
        onRehydrateStorage: () => () => {
          // Re-wire using live getState() so closures always read current state,
          // not the stale snapshot that existed at rehydration time.
          wireSession(
            () => ({ access: useAuthStore.getState().accessToken, refresh: useAuthStore.getState().refreshToken }),
            (access, refresh) => useAuthStore.getState().setTokens(access, refresh),
            () => useAuthStore.getState().logout(),
          );
        },
      }
    ),
    { name: "expressforge-auth" }
  )
);
