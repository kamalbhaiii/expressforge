import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className, glow }: CardProps) {
  return (
    <div
      className={cn(
        "bg-forge-surface border border-forge-border rounded-xl p-5 transition-all duration-200",
        glow && "border-forge-accent/40 shadow-lg shadow-forge-accent/10",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-center gap-2", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-sm font-semibold uppercase tracking-widest text-forge-text-muted", className)}>
      {children}
    </h3>
  );
}
