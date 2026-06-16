"use client";

import { useAuthStore } from "@/lib/authStore";
import { Avatar } from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Zap, LayoutDashboard, Settings, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function Nav() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const authed = isAuthenticated();

  const initials = user?.display_name
    ? user.display_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email.slice(0, 2).toUpperCase() ?? "??";

  return (
    <nav className="sticky top-0 z-40 w-full bg-forge-bg/90 backdrop-blur-md border-b border-forge-border">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href={authed ? "/dashboard" : "/"} className="flex items-center gap-2 shrink-0">
          <Zap className="h-5 w-5 text-forge-accent" />
          <span className="font-bold text-forge-text hidden sm:inline">
            Express<span className="text-forge-accent">Forge</span>
          </span>
        </Link>

        {/* Nav links — center */}
        {authed && (
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                  pathname === href
                    ? "bg-forge-accent/10 text-forge-accent"
                    : "text-forge-text-muted hover:text-forge-text hover:bg-forge-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {authed ? (
            <>
              <Link
                href="/builder"
                className="hidden sm:inline-flex forge-btn-primary text-xs py-1.5 px-4"
              >
                + New Project
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-forge-muted transition-colors">
                  <Avatar
                    src={user?.avatar_url}
                    alt={initials}
                    fallback={initials}
                    size="sm"
                  />
                  <span className="hidden sm:block text-sm text-forge-text-muted max-w-[120px] truncate">
                    {user?.display_name ?? user?.email ?? ""}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-forge-text-dim" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <div className="px-3 py-2 border-b border-forge-border">
                    <p className="text-xs font-medium text-forge-text truncate">
                      {user?.display_name ?? "Your account"}
                    </p>
                    <p className="text-xs text-forge-text-dim truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-forge-error focus:text-forge-error">
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="text-sm text-forge-text-muted hover:text-forge-text transition-colors">
                Sign in
              </Link>
              <Link href="/auth/register" className="forge-btn-primary text-xs py-1.5 px-4">
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
