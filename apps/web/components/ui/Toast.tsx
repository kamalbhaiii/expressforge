"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { create } from "zustand";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(title: string, variant: ToastVariant = "info", description?: string) {
  useToastStore.getState().add({ title, description, variant });
}

const ICONS: Record<ToastVariant, React.FC<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const COLORS: Record<ToastVariant, string> = {
  success: "text-forge-success",
  error: "text-forge-error",
  info: "text-forge-accent",
};

export function ToastProvider() {
  const { toasts, remove } = useToastStore();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant];
        return (
          <ToastPrimitive.Root
            key={t.id}
            open
            onOpenChange={(open) => !open && remove(t.id)}
            duration={4000}
            className={cn(
              "group pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden",
              "rounded-xl border border-forge-border bg-forge-surface p-4 shadow-xl",
              "data-[swipe=cancel]:translate-x-0",
              "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
              "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[swipe=end]:animate-out data-[state=closed]:fade-out-80",
              "data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full"
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", COLORS[t.variant])} />
            <div className="flex-1 space-y-1">
              <ToastPrimitive.Title className="text-sm font-semibold text-forge-text">
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="text-xs text-forge-text-muted">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              className="text-forge-text-dim hover:text-forge-text transition-colors"
              onClick={() => remove(t.id)}
            >
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm" />
    </ToastPrimitive.Provider>
  );
}
