"use client";

import { Database, Check } from "lucide-react";
import { useConfigStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const DB_OPTIONS = [
  { value: "mongodb", label: "MongoDB", desc: "Document database", orm: "Mongoose" },
  { value: "postgres_prisma", label: "PostgreSQL", desc: "Relational + type-safe queries", orm: "Prisma" },
  { value: "mysql_prisma", label: "MySQL", desc: "Relational database", orm: "Prisma" },
  { value: "postgres_sequelize", label: "PostgreSQL", desc: "Relational database", orm: "Sequelize" },
  { value: "sqlite_prisma", label: "SQLite", desc: "Embedded, zero-config database", orm: "Prisma" },
  { value: "redis", label: "Redis", desc: "In-memory key-value / cache store", orm: "ioredis" },
] as const;

export function DatabasePicker() {
  const { config, toggle } = useConfigStore();
  const selected = config.database as string[];

  return (
    <Card>
      <CardHeader>
        <Database className="h-4 w-4 text-forge-accent" />
        <CardTitle>Database</CardTitle>
        <span className="ml-auto text-xs text-forge-text-dim">multi-select</span>
      </CardHeader>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {DB_OPTIONS.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              data-testid={`db-${opt.value}`}
              onClick={() => toggle("database", opt.value)}
              className={cn(
                "text-left p-3 rounded-lg border transition-all duration-150",
                active
                  ? "border-forge-accent bg-forge-accent/10 shadow-sm shadow-forge-accent/20"
                  : "border-forge-border bg-forge-bg hover:border-forge-muted"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-forge-text">{opt.label}</span>
                <div className={cn(
                  "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                  active ? "bg-forge-accent border-forge-accent" : "border-forge-border"
                )}>
                  {active && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
              </div>
              <p className="text-xs text-forge-text-muted">{opt.desc}</p>
              <p className="mt-1.5 text-xs font-mono text-forge-glow">{opt.orm}</p>
            </button>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="mt-2 text-xs text-forge-text-dim">No database selected — app will run without persistence</p>
      )}
    </Card>
  );
}
