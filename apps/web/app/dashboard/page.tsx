"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, SortAsc, Loader2, FolderOpen } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { listProjects } from "@/lib/api";
import { Nav } from "@/components/Nav";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey = "updated_at" | "created_at" | "name";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated_at");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login");
      return;
    }
    listProjects()
      .then(setProjects)
      .catch(() => toast("Failed to load projects", "error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...projects];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return new Date(b[sort]).getTime() - new Date(a[sort]).getTime();
    });
    return list;
  }, [projects, search, sort]);

  function handleDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  function handleDuplicate(dup: Project) {
    setProjects((prev) => [dup, ...prev]);
  }

  return (
    <div className="min-h-screen bg-forge-bg">
      <Nav />

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-forge-text">Projects</h1>
            <p className="text-forge-text-muted text-sm mt-0.5">
              {loading ? "Loading…" : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => router.push("/builder")}
            className="forge-btn-primary flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {/* Filters */}
        {!loading && projects.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forge-text-dim pointer-events-none" />
              <input
                type="search"
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="forge-input w-full pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-forge-text-dim shrink-0" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="forge-input text-sm"
              >
                <option value="updated_at">Last modified</option>
                <option value="created_at">Date created</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState search={search} onNew={() => router.push("/builder")} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ search, onNew }: { search: string; onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-forge-accent/10 flex items-center justify-center mb-5">
        <FolderOpen className="h-8 w-8 text-forge-accent" />
      </div>
      {search ? (
        <>
          <h2 className="text-lg font-semibold text-forge-text mb-1">No results</h2>
          <p className="text-forge-text-muted text-sm">
            No projects match &ldquo;{search}&rdquo;
          </p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-forge-text mb-1">No projects yet</h2>
          <p className="text-forge-text-muted text-sm mb-6">
            Create your first Express.js project to get started.
          </p>
          <button onClick={onNew} className="forge-btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Project
          </button>
        </>
      )}
    </div>
  );
}
