"use client";

import { useState } from "react";
import { Sparkles, Code2, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouteStore } from "@/lib/routeStore";
import { useConfigStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Route } from "@/lib/types";

interface HandlerEditorProps {
  route: Route;
}

export function HandlerEditor({ route }: HandlerEditorProps) {
  const { updateRoute, generateHandlerAI, handlerGenStatus, handlerGenError } = useRouteStore();
  const { config, aiConfig } = useConfigStore();

  const [aiPrompt, setAiPrompt] = useState("");
  const [tab, setTab] = useState<"code" | "ai">(route.handler_mode === "ai" ? "ai" : "code");

  const genStatus = handlerGenStatus[route.id] ?? "idle";
  const genError = handlerGenError[route.id] ?? "";

  async function handleGenerate() {
    if (!aiPrompt.trim()) return;
    await generateHandlerAI(route.id, aiPrompt, { ...config, ai: aiConfig ?? undefined });
    setTab("code");
  }

  const placeholder = `// Handler for ${route.method} ${route.path}
// This will be auto-generated based on your route settings
async (req, res) => {
  res.json({ message: "Hello from ExpressForge!" });
}`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-forge-border">
        <div className="flex items-center gap-1 bg-forge-muted rounded-lg p-0.5">
          <button
            onClick={() => setTab("code")}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors",
              tab === "code"
                ? "bg-forge-surface text-forge-text shadow-sm"
                : "text-forge-text-muted hover:text-forge-text"
            )}
          >
            <Code2 className="h-3.5 w-3.5" /> Handler code
          </button>
          <button
            onClick={() => setTab("ai")}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors",
              tab === "ai"
                ? "bg-forge-surface text-forge-text shadow-sm"
                : "text-forge-text-muted hover:text-forge-text"
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-forge-accent" /> AI Generate
          </button>
        </div>

        {route.handler_mode === "ai" && (
          <span className="text-[10px] bg-forge-accent/15 text-forge-accent px-2 py-0.5 rounded-full border border-forge-accent/20">
            AI-generated
          </span>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "code" ? (
          <textarea
            value={route.handler_code ?? ""}
            onChange={(e) => updateRoute(route.id, { handler_code: e.target.value, handler_mode: "template" })}
            placeholder={placeholder}
            spellCheck={false}
            className={cn(
              "flex-1 w-full resize-none bg-transparent p-4 font-mono text-xs text-forge-text",
              "focus:outline-none placeholder:text-forge-text-dim/40",
              "leading-relaxed"
            )}
          />
        ) : (
          <div className="flex-1 flex flex-col p-4 gap-4">
            {/* AI prompt */}
            <div className="space-y-2">
              <label className="forge-label flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-forge-accent" />
                Describe what this handler should do
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={`e.g. "Fetch a list of users from the database, filter by is_active=true, sort by created_at DESC, and return them paginated (limit 20)"`}
                rows={4}
                className="forge-input w-full text-sm resize-none leading-relaxed"
              />
            </div>

            {/* AI config hint */}
            {!useConfigStore.getState().aiConfig?.api_key && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  Configure your AI API key in the Config panel below to use AI generation.
                </p>
              </div>
            )}

            {genError && (
              <div className="flex items-start gap-2 bg-forge-error/10 border border-forge-error/20 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 text-forge-error shrink-0 mt-0.5" />
                <p className="text-xs text-forge-error">{genError}</p>
              </div>
            )}

            {genStatus === "success" && (
              <div className="flex items-center gap-2 bg-forge-success/10 border border-forge-success/20 rounded-lg p-3">
                <CheckCircle2 className="h-4 w-4 text-forge-success" />
                <p className="text-xs text-forge-success">Handler generated — switch to Code tab to view.</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={genStatus === "loading" || !aiPrompt.trim()}
              className="forge-btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {genStatus === "loading" ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate Handler</>
              )}
            </button>

            {/* Route context hint */}
            <div className="bg-forge-muted/40 rounded-lg p-3 text-xs text-forge-text-dim space-y-1">
              <p className="font-medium text-forge-text-muted">Route context sent to AI</p>
              <p><span className="text-forge-text-muted">Method:</span> {route.method}</p>
              <p><span className="text-forge-text-muted">Path:</span> {route.path}</p>
              <p><span className="text-forge-text-muted">Auth required:</span> {route.auth_required ? "Yes" : "No"}</p>
              {route.request_body.fields.length > 0 && (
                <p><span className="text-forge-text-muted">Body fields:</span> {route.request_body.fields.map(f => f.name).join(", ")}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
