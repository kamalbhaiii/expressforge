"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/onboardingStore";
import { useAuthStore } from "@/lib/authStore";
import { Step1Welcome } from "@/components/onboarding/Step1Welcome";
import { Step2Stack } from "@/components/onboarding/Step2Stack";
import { Step3AI } from "@/components/onboarding/Step3AI";
import { Step4Project } from "@/components/onboarding/Step4Project";

export default function OnboardingStepPage({
  params,
}: {
  params: { step: string };
}) {
  const stepNum = parseInt(params.step, 10);

  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { completed, setStep } = useOnboardingStore();

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/auth/login"); return; }
    if (completed) { router.replace("/dashboard"); return; }
    if (isNaN(stepNum) || stepNum < 1 || stepNum > 4) {
      router.replace("/onboarding/step/1");
      return;
    }
    setStep(stepNum);
  }, [stepNum]);

  if (!isAuthenticated() || completed) return null;

  function go(n: number) {
    setStep(n);
    router.push(`/onboarding/step/${n}`);
  }

  switch (stepNum) {
    case 1: return <Step1Welcome onNext={() => go(2)} />;
    case 2: return <Step2Stack onNext={() => go(3)} onBack={() => go(1)} />;
    case 3: return <Step3AI onNext={() => go(4)} onBack={() => go(2)} />;
    case 4: return <Step4Project onBack={() => go(3)} />;
    default: return null;
  }
}
