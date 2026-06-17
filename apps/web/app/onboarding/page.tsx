"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/onboardingStore";
import { useAuthStore } from "@/lib/authStore";

export default function OnboardingIndex() {
  const router = useRouter();
  const { completed, step } = useOnboardingStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/auth/login"); return; }
    if (completed) { router.replace("/dashboard"); return; }
    router.replace(`/onboarding/step?n=${step}`);
  }, []);

  return null;
}
