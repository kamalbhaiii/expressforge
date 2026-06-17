"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOnboardingStore } from "@/lib/onboardingStore";
import { useAuthStore } from "@/lib/authStore";
import { Step1Welcome } from "@/components/onboarding/Step1Welcome";
import { Step2Stack } from "@/components/onboarding/Step2Stack";
import { Step3AI } from "@/components/onboarding/Step3AI";
import { Step4Project } from "@/components/onboarding/Step4Project";

function OnboardingStepContent() {
  const router = useRouter();
  const params = useSearchParams();
  const stepNum = parseInt(params.get("n") ?? "1", 10);

  const { isAuthenticated } = useAuthStore();
  const { completed, setStep } = useOnboardingStore();

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/auth/login"); return; }
    if (completed) { router.replace("/dashboard"); return; }
    if (isNaN(stepNum) || stepNum < 1 || stepNum > 4) {
      router.replace("/onboarding/step?n=1");
      return;
    }
    setStep(stepNum);
  }, [stepNum]);

  if (!isAuthenticated() || completed) return null;

  function go(n: number) {
    setStep(n);
    router.push(`/onboarding/step?n=${n}`);
  }

  switch (stepNum) {
    case 1: return <Step1Welcome onNext={() => go(2)} />;
    case 2: return <Step2Stack onNext={() => go(3)} onBack={() => go(1)} />;
    case 3: return <Step3AI onNext={() => go(4)} onBack={() => go(2)} />;
    case 4: return <Step4Project onBack={() => go(3)} />;
    default: return null;
  }
}

export default function OnboardingStepPage() {
  return (
    <Suspense>
      <OnboardingStepContent />
    </Suspense>
  );
}
