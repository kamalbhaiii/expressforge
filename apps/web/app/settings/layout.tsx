"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { User, ShieldCheck, Bell } from "lucide-react";
import { Nav } from "@/components/Nav";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/security", label: "Security", icon: ShieldCheck },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-forge-bg">
      <Nav />
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-forge-text">Settings</h1>
          <p className="text-forge-text-muted text-sm mt-1">Manage your account preferences</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-8">
          {/* Sidebar */}
          <aside className="sm:w-48 shrink-0">
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                    pathname === href
                      ? "bg-forge-accent/10 text-forge-accent font-medium"
                      : "text-forge-text-muted hover:text-forge-text hover:bg-forge-muted"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
