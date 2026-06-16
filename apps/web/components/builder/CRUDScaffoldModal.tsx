"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { useRouteStore } from "@/lib/routeStore";
import { toast } from "@/components/ui/Toast";

interface CRUDScaffoldModalProps {
  open: boolean;
  onClose: () => void;
}

const PRESETS = ["User", "Post", "Product", "Order", "Comment", "Category"];

export function CRUDScaffoldModal({ open, onClose }: CRUDScaffoldModalProps) {
  const { scaffoldCRUD } = useRouteStore();
  const [resource, setResource] = useState("");

  function handleScaffold() {
    const name = resource.trim();
    if (!name) return;
    scaffoldCRUD(name);
    toast(`CRUD routes scaffolded for "${name}"`, "success");
    setResource("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-forge-accent" />
            CRUD Scaffold
          </DialogTitle>
          <DialogDescription>
            Generate 5 REST routes (list, get, create, update, delete) for a resource.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="forge-label">Resource name</label>
            <input
              type="text"
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScaffold()}
              placeholder="e.g. Product"
              className="forge-input w-full mt-1"
              autoFocus
            />
          </div>
          <div>
            <p className="text-xs text-forge-text-dim mb-2">Quick presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setResource(p)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-forge-muted hover:bg-forge-accent/10 hover:text-forge-accent text-forge-text-muted transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-forge-muted/50 rounded-lg p-3 text-xs text-forge-text-muted space-y-1">
            <p className="font-medium text-forge-text-muted mb-1">Will generate:</p>
            {resource.trim() ? (
              <>
                <p><span className="text-blue-400 font-mono">GET</span> /{resource.toLowerCase()}</p>
                <p><span className="text-blue-400 font-mono">GET</span> /{resource.toLowerCase()}/:id</p>
                <p><span className="text-green-400 font-mono">POST</span> /{resource.toLowerCase()}</p>
                <p><span className="text-amber-400 font-mono">PUT</span> /{resource.toLowerCase()}/:id</p>
                <p><span className="text-red-400 font-mono">DELETE</span> /{resource.toLowerCase()}/:id</p>
              </>
            ) : (
              <p className="italic text-forge-text-dim">Enter a resource name to preview</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <button onClick={onClose} className="forge-btn-ghost text-sm">Cancel</button>
          <button
            onClick={handleScaffold}
            disabled={!resource.trim()}
            className="forge-btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 className="h-4 w-4" />
            Scaffold
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
