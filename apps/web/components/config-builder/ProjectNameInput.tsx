"use client";

import { Terminal } from "lucide-react";
import { useConfigStore } from "@/lib/store";
import { isValidProjectName } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

export function ProjectNameInput() {
  const { config, setProjectName, setPort, setLanguage } = useConfigStore();
  const isValid = isValidProjectName(config.project_name);

  return (
    <Card>
      <CardHeader>
        <Terminal className="h-4 w-4 text-forge-accent" />
        <CardTitle>Project Info</CardTitle>
      </CardHeader>

      <div className="space-y-4">
        <div>
          <label className="forge-label" htmlFor="project-name">
            Project Name
          </label>
          <input
            id="project-name"
            data-testid="project-name-input"
            className={`forge-input ${!isValid && config.project_name ? "border-forge-error focus:ring-forge-error" : ""}`}
            value={config.project_name}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="my-api"
            maxLength={64}
            spellCheck={false}
          />
          {!isValid && config.project_name && (
            <p className="mt-1 text-xs text-forge-error">
              Must be kebab-case: lowercase letters, numbers, hyphens only
            </p>
          )}
          <p className="mt-1 text-xs text-forge-text-dim font-mono">
            → {config.project_name || "my-api"}.zip
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="forge-label" htmlFor="language">
              Language
            </label>
            <select
              id="language"
              data-testid="language-select"
              className="forge-input"
              value={config.language}
              onChange={(e) => setLanguage(e.target.value as "javascript" | "typescript")}
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
            </select>
          </div>

          <div>
            <label className="forge-label" htmlFor="port">
              Port
            </label>
            <input
              id="port"
              data-testid="port-input"
              type="number"
              className="forge-input"
              value={config.port}
              min={1024}
              max={65535}
              onChange={(e) => setPort(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
