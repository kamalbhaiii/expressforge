"use client";

import { Upload, Mail, Clock, Radio } from "lucide-react";
import { useConfigStore } from "@/lib/store";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface PickerButtonProps {
  active: boolean;
  label: string;
  desc: string;
  pkg: string;
  onClick: () => void;
  testId?: string;
}

function PickerButton({ active, label, desc, pkg, onClick, testId }: PickerButtonProps) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={cn(
        "text-left p-3 rounded-lg border transition-all duration-150 w-full",
        active
          ? "border-forge-accent bg-forge-accent/10 shadow-sm shadow-forge-accent/20"
          : "border-forge-border bg-forge-bg hover:border-forge-muted"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-forge-text">{label}</span>
        <span className={cn(
          "h-4 w-4 rounded-full border flex items-center justify-center text-[10px] transition-colors",
          active ? "bg-forge-accent border-forge-accent text-white" : "border-forge-border"
        )}>
          {active && "✓"}
        </span>
      </div>
      <p className="text-xs text-forge-text-muted">{desc}</p>
      <p className="mt-1.5 text-xs font-mono text-forge-glow">{pkg}</p>
    </button>
  );
}

// ── File Upload ────────────────────────────────────────────────────────────────

const FILE_OPTIONS = [
  { value: "multer_local", label: "Local Storage", desc: "Save uploads to local disk", pkg: "multer" },
  { value: "multer_s3", label: "AWS S3", desc: "Stream uploads to S3 bucket", pkg: "multer-s3, @aws-sdk/client-s3" },
  { value: "multer_cloudinary", label: "Cloudinary", desc: "Auto-optimize + CDN delivery", pkg: "cloudinary, multer-storage-cloudinary" },
] as const;

export function FileUploadPicker() {
  const { config, toggle } = useConfigStore();
  const selected = config.file_upload as string[];

  return (
    <Card>
      <CardHeader>
        <Upload className="h-4 w-4 text-forge-accent" />
        <CardTitle>File Upload</CardTitle>
        <span className="ml-auto text-xs text-forge-text-dim">pick one</span>
      </CardHeader>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {FILE_OPTIONS.map((opt) => (
          <PickerButton
            key={opt.value}
            active={selected.includes(opt.value)}
            label={opt.label}
            desc={opt.desc}
            pkg={opt.pkg}
            testId={`file-${opt.value}`}
            onClick={() => {
              // Single-select: clear others in the group
              const others = FILE_OPTIONS.map((o) => o.value).filter((v) => v !== opt.value);
              others.forEach((v) => { if (selected.includes(v)) toggle("file_upload", v); });
              toggle("file_upload", opt.value);
            }}
          />
        ))}
      </div>
      {selected.length === 0 && (
        <p className="mt-2 text-xs text-forge-text-dim">No file upload selected</p>
      )}
    </Card>
  );
}

// ── Email ──────────────────────────────────────────────────────────────────────

const EMAIL_OPTIONS = [
  { value: "nodemailer_smtp", label: "Nodemailer SMTP", desc: "Send via any SMTP provider", pkg: "nodemailer" },
  { value: "resend", label: "Resend", desc: "Developer-friendly email API", pkg: "resend" },
] as const;

export function EmailPicker() {
  const { config, toggle } = useConfigStore();
  const selected = config.email as string[];

  return (
    <Card>
      <CardHeader>
        <Mail className="h-4 w-4 text-forge-accent" />
        <CardTitle>Email</CardTitle>
        <span className="ml-auto text-xs text-forge-text-dim">pick one</span>
      </CardHeader>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {EMAIL_OPTIONS.map((opt) => (
          <PickerButton
            key={opt.value}
            active={selected.includes(opt.value)}
            label={opt.label}
            desc={opt.desc}
            pkg={opt.pkg}
            testId={`email-${opt.value}`}
            onClick={() => {
              const others = EMAIL_OPTIONS.map((o) => o.value).filter((v) => v !== opt.value);
              others.forEach((v) => { if (selected.includes(v)) toggle("email", v); });
              toggle("email", opt.value);
            }}
          />
        ))}
      </div>
      {selected.length === 0 && (
        <p className="mt-2 text-xs text-forge-text-dim">No email provider selected</p>
      )}
    </Card>
  );
}

// ── Queues / Jobs ──────────────────────────────────────────────────────────────

const QUEUE_OPTIONS = [
  { value: "bullmq", label: "BullMQ", desc: "Redis-backed job queues with workers", pkg: "bullmq" },
  { value: "node_cron", label: "node-cron", desc: "Cron-style scheduled jobs", pkg: "node-cron" },
] as const;

export function QueuePicker() {
  const { config, toggle } = useConfigStore();
  const selected = config.queues as string[];

  return (
    <Card>
      <CardHeader>
        <Clock className="h-4 w-4 text-forge-accent" />
        <CardTitle>Queues & Jobs</CardTitle>
        <span className="ml-auto text-xs text-forge-text-dim">multi-select</span>
      </CardHeader>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {QUEUE_OPTIONS.map((opt) => (
          <PickerButton
            key={opt.value}
            active={selected.includes(opt.value)}
            label={opt.label}
            desc={opt.desc}
            pkg={opt.pkg}
            testId={`queue-${opt.value}`}
            onClick={() => toggle("queues", opt.value)}
          />
        ))}
      </div>
      {selected.length === 0 && (
        <p className="mt-2 text-xs text-forge-text-dim">No queue/job library selected</p>
      )}
    </Card>
  );
}

// ── WebSockets ─────────────────────────────────────────────────────────────────

const WS_OPTIONS = [
  { value: "socket_io", label: "Socket.IO", desc: "Full-featured real-time engine with rooms", pkg: "socket.io" },
  { value: "ws", label: "ws", desc: "Lightweight native WebSocket server", pkg: "ws" },
] as const;

export function WebSocketPicker() {
  const { config, toggle } = useConfigStore();
  const selected = config.websockets as string[];

  return (
    <Card>
      <CardHeader>
        <Radio className="h-4 w-4 text-forge-accent" />
        <CardTitle>WebSockets</CardTitle>
        <span className="ml-auto text-xs text-forge-text-dim">pick one</span>
      </CardHeader>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {WS_OPTIONS.map((opt) => (
          <PickerButton
            key={opt.value}
            active={selected.includes(opt.value)}
            label={opt.label}
            desc={opt.desc}
            pkg={opt.pkg}
            testId={`ws-${opt.value}`}
            onClick={() => {
              const others = WS_OPTIONS.map((o) => o.value).filter((v) => v !== opt.value);
              others.forEach((v) => { if (selected.includes(v)) toggle("websockets", v); });
              toggle("websockets", opt.value);
            }}
          />
        ))}
      </div>
      {selected.length === 0 && (
        <p className="mt-2 text-xs text-forge-text-dim">No WebSocket library selected</p>
      )}
    </Card>
  );
}
