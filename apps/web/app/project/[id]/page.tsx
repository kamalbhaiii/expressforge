"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { getProject } from "@/lib/api";
import { useRouteStore } from "@/lib/routeStore";
import { useConfigStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import type { Project } from "@/lib/types";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { loadRoutes } = useRouteStore();
  const { reset } = useConfigStore();

  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login");
      return;
    }

    getProject(id)
      .then((project: Project) => {
        reset();
        const { setProjectName, setLanguage, setPort, toggle, setIncludeDocker, setIncludeTests, setIncludeSwagger, setSavedProjectId } =
          useConfigStore.getState();

        setProjectName(project.config.project_name);
        setLanguage(project.config.language);
        setPort(project.config.port);
        project.config.auth.forEach((v) => toggle("auth", v));
        project.config.database.forEach((v) => toggle("database", v));
        project.config.middleware.forEach((v) => toggle("middleware", v));
        project.config.file_upload.forEach((v) => toggle("file_upload", v));
        project.config.email.forEach((v) => toggle("email", v));
        project.config.queues.forEach((v) => toggle("queues", v));
        project.config.websockets.forEach((v) => toggle("websockets", v));
        setIncludeDocker(project.config.include_docker);
        setIncludeTests(project.config.include_tests);
        setIncludeSwagger(project.config.include_swagger);
        setSavedProjectId(project.id);

        loadRoutes(project.routes ?? []);
        router.replace("/builder");
      })
      .catch(() => setError("Project not found or you don't have access to it."));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-forge-bg flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-forge-error mx-auto mb-3" />
          <p className="text-forge-text font-medium mb-1">{error}</p>
          <button onClick={() => router.push("/dashboard")} className="forge-btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-forge-accent mx-auto mb-3" />
        <p className="text-forge-text-muted text-sm">Loading project…</p>
      </div>
    </div>
  );
}
