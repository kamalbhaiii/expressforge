/**
 * Shared axios instance + 401 interceptor for silent token refresh.
 *
 * Pattern: "refresh token queue"
 *  - First 401 triggers a refresh attempt and sets isRefreshing = true
 *  - Subsequent 401s during refresh are queued (promise callbacks)
 *  - On refresh success  → replay all queued requests with new token
 *  - On refresh failure  → reject all queued requests + logout
 */
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

// Extended config to track retry state
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Lazily imported at runtime to avoid circular deps at module init time
let _getTokens: (() => { access: string | null; refresh: string | null }) | null = null;
let _setTokens: ((access: string, refresh: string) => void) | null = null;
let _logout: (() => void) | null = null;

export function wireSession(
  getTokens: () => { access: string | null; refresh: string | null },
  setTokens: (access: string, refresh: string) => void,
  logout: () => void,
) {
  _getTokens = getTokens;
  _setTokens = setTokens;
  _logout = logout;
}

export const http = axios.create({
  baseURL: "/api",
  timeout: 60_000,
});

// ── Request interceptor — attach access token ─────────────────────────────────
http.interceptors.request.use((config) => {
  const tokens = _getTokens?.();
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

// ── Response interceptor — silent refresh on 401 ─────────────────────────────
let isRefreshing = false;
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
let queue: QueueEntry[] = [];

function processQueue(error: unknown, token: string | null) {
  for (const entry of queue) {
    if (error) entry.reject(error);
    else entry.resolve(token!);
  }
  queue = [];
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;

    // Only handle 401 on non-auth routes (auth/login, auth/refresh etc. should fail normally)
    const isAuthRoute = original?.url?.includes("/auth/");
    if (error.response?.status !== 401 || original?._retry || isAuthRoute) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the ongoing refresh completes
      return new Promise<string>((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        if (original) {
          original.headers.Authorization = `Bearer ${token}`;
          return http(original);
        }
      });
    }

    original!._retry = true;
    isRefreshing = true;

    try {
      const refresh = _getTokens?.()?.refresh;
      if (!refresh) throw new Error("No refresh token");

      // Call refresh directly (bypass the intercepted instance to avoid loops)
      const { data } = await axios.post("/api/auth/refresh", { refresh_token: refresh });
      const newAccess: string = data.access_token;
      const newRefresh: string = data.refresh_token;

      _setTokens?.(newAccess, newRefresh);
      processQueue(null, newAccess);

      if (original) {
        original.headers.Authorization = `Bearer ${newAccess}`;
        return http(original);
      }
    } catch (refreshError) {
      processQueue(refreshError, null);
      _logout?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
