"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Download, ArrowLeft, Terminal, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function CopyButton({ text }: { text: string }) {
  const handleCopy = () => navigator.clipboard.writeText(text);
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-forge-muted transition-colors text-forge-text-dim hover:text-forge-text"
      title="Copy"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

function DownloadPage() {
  const params = useSearchParams();
  const projectName = params.get("name") || "my-api";

  const commands = [
    { label: "1. Unzip", cmd: `unzip ${projectName}.zip` },
    { label: "2. Enter directory", cmd: `cd ${projectName}` },
    { label: "3. Install deps", cmd: "npm install" },
    { label: "4. Copy env file", cmd: "cp .env.example .env" },
    { label: "5. Start dev server", cmd: "npm run dev" },
  ];

  return (
    <main className="min-h-screen bg-forge-bg flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl space-y-6 animate-slide-in">
        {/* Success header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-forge-text">
            <span className="text-forge-accent font-mono">{projectName}.zip</span> ready!
          </h1>
          <p className="text-forge-text-muted text-sm">
            Your download should have started automatically.
          </p>
        </div>

        {/* Quick start */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="h-4 w-4 text-forge-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-forge-text-muted">
              Quick Start
            </h2>
          </div>

          <div className="space-y-2">
            {commands.map(({ label, cmd }) => (
              <div key={cmd} className="group flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-forge-text-dim w-28 flex-shrink-0">{label}</span>
                  <code className="text-xs font-mono text-forge-glow bg-forge-bg px-2 py-1 rounded truncate">
                    {cmd}
                  </code>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <CopyButton text={cmd} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full" size="md">
              <ArrowLeft className="h-4 w-4" />
              Build another
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-forge-bg" />}>
      <DownloadPage />
    </Suspense>
  );
}
