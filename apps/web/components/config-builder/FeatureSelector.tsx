"use client";

import { Settings2 } from "lucide-react";
import { useConfigStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface ToggleRowProps {
  id: string;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}

function ToggleRow({ id, label, desc, checked, onChange }: ToggleRowProps) {
  return (
    <label htmlFor={id} className="flex items-center justify-between gap-4 py-3 cursor-pointer group">
      <div>
        <p className="text-sm font-medium text-forge-text group-hover:text-white transition-colors">{label}</p>
        <p className="text-xs text-forge-text-dim">{desc}</p>
      </div>
      <button
        id={id}
        data-testid={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-10 h-5.5 rounded-full transition-all duration-200 flex-shrink-0",
          "focus:outline-none focus:ring-2 focus:ring-forge-glow focus:ring-offset-2 focus:ring-offset-forge-surface",
          checked ? "bg-forge-accent" : "bg-forge-muted"
        )}
      >
        <span className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200",
          checked ? "left-5.5" : "left-0.5"
        )} />
      </button>
    </label>
  );
}

export function FeatureSelector() {
  const { config, setIncludeDocker, setIncludeTests, setIncludeSwagger } = useConfigStore();

  return (
    <Card>
      <CardHeader>
        <Settings2 className="h-4 w-4 text-forge-accent" />
        <CardTitle>Extras</CardTitle>
      </CardHeader>

      <div className="divide-y divide-forge-border">
        <ToggleRow
          id="toggle-docker"
          label="Include Docker"
          desc="Generates Dockerfile + docker-compose.yml"
          checked={config.include_docker}
          onChange={setIncludeDocker}
        />
        <ToggleRow
          id="toggle-tests"
          label="Include Tests"
          desc="Jest setup + basic route tests"
          checked={config.include_tests}
          onChange={setIncludeTests}
        />
        <ToggleRow
          id="toggle-swagger"
          label="Swagger UI"
          desc="Interactive API docs at /api-docs"
          checked={config.include_swagger}
          onChange={setIncludeSwagger}
        />
      </div>
    </Card>
  );
}
