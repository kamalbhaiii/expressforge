"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, AlertCircle, Layers, Settings2 } from "lucide-react";
import { AuthPicker } from "@/components/config-builder/AuthPicker";
import { DatabasePicker } from "@/components/config-builder/DatabasePicker";
import { FeatureSelector } from "@/components/config-builder/FeatureSelector";
import { MiddlewarePicker } from "@/components/config-builder/MiddlewarePicker";
import { PreviewPane } from "@/components/config-builder/PreviewPane";
import { ProjectNameInput } from "@/components/config-builder/ProjectNameInput";
import { AIConfigPicker } from "@/components/config-builder/AIConfigPicker";
import {
  FileUploadPicker,
  EmailPicker,
  QueuePicker,
  WebSocketPicker,
} from "@/components/config-builder/Phase2Pickers";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RouteCanvas } from "@/components/builder/RouteCanvas";
import { RouteFormPanel } from "@/components/builder/RouteFormPanel";
import { HandlerEditor } from "@/components/builder/HandlerEditor";
import { Nav } from "@/components/Nav";
import { generateProject, downloadBlob, checkHealth, getApiError } from "@/lib/api";
import { useConfigStore } from "@/lib/store";
import { useRouteStore } from "@/lib/routeStore";
import { useAuthStore } from "@/lib/authStore";
import { isValidProjectName } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Tab = "config" | "routes";

export default function BuilderPage() {
  const { config, aiConfig, status, error, isServerColdStart, setStatus, setServerColdStart } =
    useConfigStore();
  const { routes, selectedRouteId } = useRouteStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const healthChecked = useRef(false);
  const [tab, setTab] = useState<Tab>("config");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login");
    }
  }, []);

  useEffect(() => {
    if (healthChecked.current) return;
    healthChecked.current = true;
    const timeout = setTimeout(() => setServerColdStart(true), 3000);
    checkHealth()
      .then(() => { clearTimeout(timeout); setServerColdStart(false); })
      .catch(() => { clearTimeout(timeout); setServerColdStart(true); });
  }, [setServerColdStart]);

  if (!isAuthenticated()) return null;

  const canGenerate = isValidProjectName(config.project_name) && status !== "loading";
  const selectedRoute = useRouteStore.getState().routes.find((r) => r.id === selectedRouteId);

  async function handleGenerate() {
    if (!canGenerate) return;
    setStatus("loading");
    try {
      const blob = await generateProject(config, aiConfig, routes);
      downloadBlob(blob, `${config.project_name}.zip`);
      setStatus("success");
      router.push(`/generate?name=${encodeURIComponent(config.project_name)}`);
    } catch (err) {
      setStatus("error", getApiError(err));
    }
  }

  return (
    <div className="min-h-screen bg-forge-bg flex flex-col">
      <Nav />

      {isServerColdStart && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
          <div className="max-w-screen-xl mx-auto flex items-center gap-2 text-sm text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Server is warming up — first generation may take 20–30 seconds.
          </div>
        </div>
      )}

      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Page header + tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-forge-text">Project Builder</h1>
            <p className="text-forge-text-muted text-sm mt-0.5">
              Configure your stack, define routes, then generate.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-forge-muted rounded-xl p-1 self-start sm:self-auto">
            <button
              onClick={() => setTab("config")}
              className={cn(
                "flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-colors",
                tab === "config"
                  ? "bg-forge-surface text-forge-text shadow-sm"
                  : "text-forge-text-muted hover:text-forge-text"
              )}
            >
              <Settings2 className="h-4 w-4" /> Config
            </button>
            <button
              onClick={() => setTab("routes")}
              className={cn(
                "flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-colors",
                tab === "routes"
                  ? "bg-forge-surface text-forge-text shadow-sm"
                  : "text-forge-text-muted hover:text-forge-text"
              )}
            >
              <Layers className="h-4 w-4" /> Routes
              {routes.length > 0 && (
                <Badge variant="default" className="ml-1 text-[10px] h-4 px-1.5">
                  {routes.length}
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Config tab */}
        {tab === "config" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <ProjectNameInput />
              <AuthPicker />
              <DatabasePicker />
              <MiddlewarePicker />
              <FileUploadPicker />
              <EmailPicker />
              <QueuePicker />
              <WebSocketPicker />
              <FeatureSelector />
              <AIConfigPicker />

              {status === "error" && error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                data-testid="generate-button"
                size="lg"
                className="w-full"
                onClick={handleGenerate}
                loading={status === "loading"}
                disabled={!canGenerate}
              >
                <Zap className="h-4 w-4" />
                {status === "loading" ? "Generating your project…" : "Generate & Download"}
              </Button>

              {!isValidProjectName(config.project_name) && (
                <p className="text-center text-xs text-forge-text-dim">
                  Enter a valid project name to enable generation
                </p>
              )}
            </div>

            <div className="lg:col-span-1">
              <PreviewPane />
            </div>
          </div>
        )}

        {/* Routes tab */}
        {tab === "routes" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-240px)] min-h-[500px]">
            {/* Route list — left panel */}
            <div className="lg:col-span-3 bg-forge-surface border border-forge-border rounded-xl overflow-hidden flex flex-col">
              <RouteCanvas />
            </div>

            {/* Form panel + handler editor — middle + right */}
            {selectedRoute ? (
              <>
                <div className="lg:col-span-4 bg-forge-surface border border-forge-border rounded-xl overflow-hidden flex flex-col">
                  <RouteFormPanel route={selectedRoute} />
                </div>
                <div className="lg:col-span-5 bg-forge-surface border border-forge-border rounded-xl overflow-hidden flex flex-col">
                  <HandlerEditor route={selectedRoute} />
                </div>
              </>
            ) : (
              <div className="lg:col-span-9 bg-forge-surface border border-forge-border rounded-xl flex items-center justify-center text-center p-8">
                <div>
                  <Layers className="h-10 w-10 text-forge-accent/30 mx-auto mb-3" />
                  <p className="text-forge-text-muted font-medium mb-1">Select a route to edit</p>
                  <p className="text-forge-text-dim text-sm">
                    Click a route on the left to configure it, or add a new one.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate button always visible in routes tab too */}
        {tab === "routes" && (
          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <p className="text-xs text-forge-text-dim">
              {routes.length} route{routes.length !== 1 ? "s" : ""} defined · changes are auto-saved in this session
            </p>
            <Button
              size="sm"
              onClick={handleGenerate}
              loading={status === "loading"}
              disabled={!canGenerate}
              className="shrink-0"
            >
              <Zap className="h-4 w-4" />
              {status === "loading" ? "Generating…" : "Generate & Download"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
