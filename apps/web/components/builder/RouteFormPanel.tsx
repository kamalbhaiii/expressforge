"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useRouteStore } from "@/lib/routeStore";
import type { FieldSchema, HttpMethod, Route } from "@/lib/types";
import { cn } from "@/lib/utils";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: "text-blue-400",
  POST: "text-green-400",
  PUT: "text-amber-400",
  PATCH: "text-orange-400",
  DELETE: "text-red-400",
};
const FIELD_TYPES = ["string", "number", "boolean", "date", "uuid"] as const;

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}
function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-forge-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-forge-muted/40 hover:bg-forge-muted/70 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-forge-text-muted uppercase tracking-wider">{title}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-forge-text-dim" /> : <ChevronDown className="h-3.5 w-3.5 text-forge-text-dim" />}
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
}

interface RouteFormPanelProps {
  route: Route;
}

export function RouteFormPanel({ route }: RouteFormPanelProps) {
  const { updateRoute } = useRouteStore();
  const update = (updates: Partial<Route>) => updateRoute(route.id, updates);

  function addField() {
    const newField: FieldSchema = { name: "", type: "string", required: true };
    update({ request_body: { ...route.request_body, fields: [...route.request_body.fields, newField] } });
  }

  function updateField(idx: number, patch: Partial<FieldSchema>) {
    const fields = route.request_body.fields.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    update({ request_body: { ...route.request_body, fields } });
  }

  function removeField(idx: number) {
    const fields = route.request_body.fields.filter((_, i) => i !== idx);
    update({ request_body: { ...route.request_body, fields } });
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-forge-border">
        <h2 className="text-sm font-semibold text-forge-text">Route Settings</h2>
      </div>

      <div className="p-4 space-y-3 flex-1">
        {/* Basic */}
        <Section title="Endpoint">
          <div className="flex gap-2">
            <select
              value={route.method}
              onChange={(e) => update({ method: e.target.value as HttpMethod })}
              className={cn("forge-input text-sm font-bold w-28 shrink-0", METHOD_COLOR[route.method])}
            >
              {METHODS.map((m) => (
                <option key={m} value={m} className="text-forge-text">
                  {m}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={route.path}
              onChange={(e) => update({ path: e.target.value })}
              placeholder="/path/:param"
              className="forge-input flex-1 font-mono text-sm"
            />
          </div>
          <div>
            <label className="forge-label">Tag / Group</label>
            <input
              type="text"
              value={route.tag}
              onChange={(e) => update({ tag: e.target.value })}
              placeholder="e.g. users"
              className="forge-input w-full mt-1 text-sm"
            />
          </div>
          <div>
            <label className="forge-label">Summary</label>
            <input
              type="text"
              value={route.summary}
              onChange={(e) => update({ summary: e.target.value })}
              placeholder="Short description"
              className="forge-input w-full mt-1 text-sm"
            />
          </div>
        </Section>

        {/* Options */}
        <Section title="Options" defaultOpen={false}>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={route.auth_required}
              onChange={(e) => update({ auth_required: e.target.checked })}
              className="forge-checkbox"
            />
            <span className="text-sm text-forge-text">Require authentication</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={route.rate_limited}
              onChange={(e) => update({ rate_limited: e.target.checked })}
              className="forge-checkbox"
            />
            <span className="text-sm text-forge-text">Apply rate limiting</span>
          </label>
        </Section>

        {/* Request body — only for POST/PUT/PATCH */}
        {["POST", "PUT", "PATCH"].includes(route.method) && (
          <Section title="Request Body">
            <div>
              <label className="forge-label">Body type</label>
              <select
                value={route.request_body.type}
                onChange={(e) =>
                  update({ request_body: { ...route.request_body, type: e.target.value as Route["request_body"]["type"] } })
                }
                className="forge-input w-full mt-1 text-sm"
              >
                <option value="json">JSON</option>
                <option value="formdata">Form Data (multipart)</option>
                <option value="none">None</option>
              </select>
            </div>

            {route.request_body.type !== "none" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="forge-label">Fields</label>
                  <button
                    onClick={addField}
                    className="text-xs flex items-center gap-1 text-forge-accent hover:text-forge-glow transition-colors"
                  >
                    <Plus className="h-3 w-3" /> Add field
                  </button>
                </div>
                {route.request_body.fields.length === 0 ? (
                  <p className="text-xs text-forge-text-dim italic">No fields defined</p>
                ) : (
                  route.request_body.fields.map((field, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updateField(idx, { name: e.target.value })}
                        placeholder="field_name"
                        className="forge-input flex-1 text-xs font-mono"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(idx, { type: e.target.value as FieldSchema["type"] })}
                        className="forge-input w-24 text-xs"
                      >
                        {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <label className="flex items-center gap-1 pt-1.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(idx, { required: e.target.checked })}
                          className="forge-checkbox"
                        />
                        <span className="text-xs text-forge-text-dim">req</span>
                      </label>
                      <button
                        onClick={() => removeField(idx)}
                        className="pt-1.5 text-forge-text-dim hover:text-forge-error transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </Section>
        )}

        {/* Response */}
        <Section title="Response" defaultOpen={false}>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="forge-label">Status code</label>
              <input
                type="number"
                value={route.response.success_code}
                onChange={(e) => update({ response: { ...route.response, success_code: Number(e.target.value) } })}
                className="forge-input w-full mt-1 text-sm"
                min={100}
                max={599}
              />
            </div>
            <div className="flex-1">
              <label className="forge-label">Shape</label>
              <select
                value={route.response.shape}
                onChange={(e) =>
                  update({ response: { ...route.response, shape: e.target.value as Route["response"]["shape"] } })
                }
                className="forge-input w-full mt-1 text-sm"
              >
                <option value="json_object">JSON Object</option>
                <option value="json_array">JSON Array</option>
                <option value="empty">Empty (no body)</option>
              </select>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
