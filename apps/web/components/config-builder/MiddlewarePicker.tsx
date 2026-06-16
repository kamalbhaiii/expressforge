"use client";

import { Layers } from "lucide-react";
import { useConfigStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const MW_OPTIONS = [
  { value: "cors", label: "CORS", desc: "Cross-origin resource sharing" },
  { value: "helmet", label: "Helmet", desc: "Security HTTP headers" },
  { value: "rate_limit", label: "Rate Limit", desc: "Request throttling" },
  { value: "morgan", label: "Morgan", desc: "HTTP request logger" },
  { value: "compression", label: "Compression", desc: "Gzip responses" },
  { value: "body_parser", label: "Body Parser", desc: "JSON + urlencoded body parsing" },
  { value: "cookie_parser", label: "Cookie Parser", desc: "Parse Cookie header" },
  { value: "multer", label: "Multer", desc: "Multipart file uploads" },
  { value: "zod", label: "Zod", desc: "TypeScript-first validation" },
  { value: "joi", label: "Joi", desc: "Schema validation" },
  { value: "express_validator", label: "express-validator", desc: "Validation middleware" },
  { value: "winston", label: "Winston", desc: "Structured logging" },
  { value: "pino", label: "Pino", desc: "Fast JSON logger" },
  { value: "swagger_ui", label: "Swagger UI", desc: "API docs at /api-docs" },
] as const;

export function MiddlewarePicker() {
  const { config, toggle } = useConfigStore();
  const middleware = config.middleware as string[];

  return (
    <Card>
      <CardHeader>
        <Layers className="h-4 w-4 text-forge-accent" />
        <CardTitle>Middleware</CardTitle>
        <span className="ml-auto text-xs text-forge-text-dim">multi-select</span>
      </CardHeader>

      <div className="flex flex-wrap gap-2">
        {MW_OPTIONS.map((opt) => {
          const active = middleware.includes(opt.value);
          return (
            <button
              key={opt.value}
              data-testid={`mw-${opt.value}`}
              onClick={() => toggle("middleware", opt.value)}
              title={opt.desc}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150",
                active
                  ? "border-forge-accent bg-forge-accent/15 text-forge-glow"
                  : "border-forge-border bg-forge-bg text-forge-text-muted hover:border-forge-muted hover:text-forge-text"
              )}
            >
              {active && <span className="h-1.5 w-1.5 rounded-full bg-forge-accent" />}
              {opt.label}
            </button>
          );
        })}
      </div>

      {middleware.length > 0 && (
        <p className="mt-3 text-xs font-mono text-forge-text-dim">
          {middleware.join(", ")}
        </p>
      )}
    </Card>
  );
}
