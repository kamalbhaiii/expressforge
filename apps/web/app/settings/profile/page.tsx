"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, User } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { updateProfile, getCurrentUser } from "@/lib/auth";
import { getApiError } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, setUser, isAuthenticated } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/auth/login");
  }, []);

  if (!isAuthenticated()) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ display_name: displayName || undefined });
      const updated = await getCurrentUser();
      setUser(updated);
      toast("Profile updated", "success");
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
        <div className="bg-forge-surface border border-forge-border rounded-2xl p-6 space-y-6">
          {/* Avatar placeholder */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-forge-accent/20 flex items-center justify-center text-forge-accent font-bold text-lg">
              {(user?.display_name ?? user?.email ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-forge-text">{user?.display_name ?? "No name set"}</p>
              <p className="text-xs text-forge-text-dim">{user?.email}</p>
            </div>
          </div>

          <hr className="border-forge-border" />

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="forge-label">Email</label>
              <input
                type="email"
                value={user?.email ?? ""}
                disabled
                className="forge-input w-full mt-1 opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-forge-text-dim mt-1">Email cannot be changed.</p>
            </div>

            <div>
              <label className="forge-label">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="forge-input w-full mt-1"
                maxLength={64}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="forge-btn-primary flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
          </form>
        </div>
    </div>
  );
}
