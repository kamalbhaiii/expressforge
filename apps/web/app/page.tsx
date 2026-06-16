"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap, ArrowRight, Shield, Database, Layers, Cpu,
  Code2, Package, CheckCircle, LogIn, User, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";

const FEATURES = [
  {
    icon: Shield,
    title: "Auth Strategies",
    desc: "JWT, Sessions, OAuth Google — pick any combination. Generated with secure defaults.",
  },
  {
    icon: Database,
    title: "Multi-Database",
    desc: "MongoDB, PostgreSQL or MySQL via Prisma or Sequelize. Schema and connection code included.",
  },
  {
    icon: Layers,
    title: "Production Middleware",
    desc: "CORS, Helmet, Rate Limiting, Morgan, Compression — toggle on, wired correctly, done.",
  },
  {
    icon: Cpu,
    title: "AI Enhancement (BYOK)",
    desc: "Bring your own Anthropic, OpenAI or Gemini key. AI writes your README and .env docs.",
  },
  {
    icon: Code2,
    title: "TypeScript or JavaScript",
    desc: "First-class TS support with tsconfig, path aliases, and typed route handlers.",
  },
  {
    icon: Package,
    title: "Docker Ready",
    desc: "Optional Dockerfile + docker-compose.yml generated alongside your app code.",
  },
];

const STEPS = [
  { step: "01", title: "Sign up", desc: "Create a free account in seconds." },
  { step: "02", title: "Configure", desc: "Pick your stack — auth, database, middleware." },
  { step: "03", title: "Download", desc: "Get a production-ready ZIP and run it immediately." },
];

export default function LandingPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  const handleCTA = () => {
    if (isAuthenticated()) {
      router.push("/builder");
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-forge-bg text-forge-text">
      {/* ── Nav ── */}
      <nav className="border-b border-forge-border bg-forge-surface/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Zap className="h-4 w-4 text-forge-accent" />
            Express<span className="text-forge-accent">Forge</span>
            <Badge variant="default" className="hidden sm:inline-flex text-[10px]">v1.1.0</Badge>
          </Link>

          <div className="flex items-center gap-2">
            {isAuthenticated() ? (
              <>
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-forge-text-muted">
                  <User className="h-3.5 w-3.5" />
                  {user?.email}
                </span>
                <Link href="/builder">
                  <Button variant="outline" size="sm">
                    <Zap className="h-3.5 w-3.5" />
                    Builder
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAuthModal(true)}>
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-forge-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-forge-accent/30 bg-forge-accent/10 text-forge-accent text-xs font-medium mb-6">
            <Zap className="h-3 w-3" />
            Production-ready Express backends in under 60 seconds
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Ship your backend
            <br />
            <span className="bg-gradient-to-r from-forge-accent to-forge-glow bg-clip-text text-transparent">
              before lunch.
            </span>
          </h1>

          <p className="text-forge-text-muted text-lg sm:text-xl mb-10 max-w-xl mx-auto">
            ExpressForge generates a fully configured Node.js backend — auth, database, middleware,
            Docker — as a clean ZIP you can run immediately.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={handleCTA} className="w-full sm:w-auto">
              <Zap className="h-4 w-4" />
              {isAuthenticated() ? "Open Builder" : "Get Started Free"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <a
              href="https://github.com/kamalbhaiii/expressforge"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                View on GitHub
              </Button>
            </a>
          </div>

          {/* Social proof micro-line */}
          <p className="mt-6 text-xs text-forge-text-dim">
            No credit card · No setup · Just code
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-16 px-4 border-t border-forge-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-forge-accent/10 border border-forge-accent/20 flex items-center justify-center font-mono font-bold text-forge-accent text-sm">
                  {step}
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-forge-text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="py-16 px-4 border-t border-forge-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-4">Everything included</h2>
          <p className="text-center text-forge-text-muted text-sm mb-12">
            Every project option is fully wired — not just scaffolded.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="forge-card p-5 rounded-xl flex flex-col gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-forge-accent/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-forge-accent" />
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-forge-text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-16 px-4 border-t border-forge-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to build?</h2>
          <p className="text-forge-text-muted text-sm mb-8">
            Create an account and generate your first backend in under a minute.
          </p>
          <Button size="lg" onClick={handleCTA}>
            <Zap className="h-4 w-4" />
            {isAuthenticated() ? "Go to Builder" : "Create Free Account"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-forge-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-forge-text-dim">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-forge-accent" />
            <span>ExpressForge v1.1.0</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-400" />
            <span>Open source · MIT License</span>
          </div>
        </div>
      </footer>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => { setShowAuthModal(false); router.push("/builder"); }}
        />
      )}
    </div>
  );
}
