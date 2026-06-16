"use client";

import { useState } from "react";
import { MoreVertical, Download, Copy, Trash2, FolderOpen, Clock, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { deleteProject, downloadBlob, duplicateProject, generateFromProject } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import type { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onDuplicate: (project: Project) => void;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-500/15 text-blue-400",
  POST: "bg-green-500/15 text-green-400",
  PUT: "bg-amber-500/15 text-amber-400",
  PATCH: "bg-orange-500/15 text-orange-400",
  DELETE: "bg-red-500/15 text-red-400",
};

export function ProjectCard({ project, onDelete, onDuplicate }: ProjectCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const techBadges = [
    ...(project.config.auth ?? []),
    ...(project.config.database ?? []),
  ].slice(0, 3);

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await generateFromProject(project.id);
      downloadBlob(blob, `${project.config.project_name}.zip`);
      toast("Project downloaded!", "success");
    } catch {
      toast("Download failed", "error");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDuplicate() {
    try {
      const dup = await duplicateProject(project.id);
      onDuplicate(dup);
      toast(`"${dup.name}" created`, "success");
    } catch {
      toast("Duplicate failed", "error");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteProject(project.id);
      onDelete(project.id);
      toast("Project deleted", "info");
    } catch {
      toast("Delete failed", "error");
      setDeleting(false);
    }
  }

  return (
    <div className={cn(
      "group relative bg-forge-surface border border-forge-border rounded-xl p-5",
      "hover:border-forge-accent/40 hover:shadow-lg hover:shadow-forge-accent/5",
      "transition-all duration-200",
      deleting && "opacity-50 pointer-events-none"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <FolderOpen className="h-4 w-4 text-forge-accent flex-shrink-0" />
          <a
            href={`/project/${project.id}`}
            className="font-semibold text-forge-text hover:text-forge-glow transition-colors truncate text-sm"
          >
            {project.name}
          </a>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-forge-muted text-forge-text-dim hover:text-forge-text">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="h-4 w-4" /> Download ZIP
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-forge-error focus:text-forge-error">
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tech badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-forge-muted text-forge-text-muted">
          {project.config.language === "typescript" ? "TS" : "JS"}
        </span>
        {techBadges.map((b) => (
          <span key={b} className="text-xs px-2 py-0.5 rounded-full bg-forge-accent/10 text-forge-accent">
            {b.replace(/_/g, " ")}
          </span>
        ))}
        {(project.config.auth.length + project.config.database.length) > 3 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-forge-muted text-forge-text-dim">
            +{project.config.auth.length + project.config.database.length - 3} more
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-forge-text-dim">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" /> {project.routes_count} routes
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" /> {project.generation_count}×
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
        </span>
      </div>

      {/* Quick download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={cn(
          "mt-4 w-full text-xs py-2 rounded-lg border border-forge-border",
          "text-forge-text-muted hover:text-forge-text hover:border-forge-accent/40",
          "hover:bg-forge-accent/5 transition-all duration-150 flex items-center justify-center gap-1.5",
          downloading && "opacity-50 cursor-not-allowed"
        )}
      >
        <Download className="h-3.5 w-3.5" />
        {downloading ? "Generating…" : "Download"}
      </button>
    </div>
  );
}
