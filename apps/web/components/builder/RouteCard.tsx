"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronRight, ShieldCheck, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Route } from "@/lib/types";

const METHOD_STYLE: Record<string, string> = {
  GET: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  POST: "bg-green-500/15 text-green-400 border-green-500/20",
  PUT: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  PATCH: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  DELETE: "bg-red-500/15 text-red-400 border-red-500/20",
};

interface RouteCardProps {
  route: Route;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function RouteCard({ route, isSelected, onSelect, onDelete }: RouteCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: route.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer",
        "transition-all duration-150 select-none",
        isSelected
          ? "bg-forge-accent/10 border-forge-accent/40 shadow-sm shadow-forge-accent/10"
          : "bg-forge-surface border-forge-border hover:border-forge-accent/25 hover:bg-forge-muted/50",
        isDragging && "opacity-40 shadow-xl"
      )}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-forge-text-dim hover:text-forge-text-muted cursor-grab active:cursor-grabbing p-0.5 rounded shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Method badge */}
      <span
        className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 font-mono",
          METHOD_STYLE[route.method]
        )}
      >
        {route.method}
      </span>

      {/* Path */}
      <span className="flex-1 text-xs text-forge-text font-mono truncate min-w-0">
        {route.path}
      </span>

      {/* Indicators */}
      <div className="flex items-center gap-1 shrink-0">
        {route.auth_required && (
          <span aria-label="Auth required" title="Auth required">
            <ShieldCheck className="h-3 w-3 text-forge-accent" />
          </span>
        )}
        {route.rate_limited && (
          <span aria-label="Rate limited" title="Rate limited">
            <Gauge className="h-3 w-3 text-amber-400" />
          </span>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-forge-text-dim hover:text-forge-error p-0.5 rounded shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {isSelected && <ChevronRight className="h-3.5 w-3.5 text-forge-accent shrink-0" />}
    </div>
  );
}
