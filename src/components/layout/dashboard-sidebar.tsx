"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  GraduationCap,
  Sparkles,
  Award,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Profile & Academic Info",
    href: "/dashboard/profile",
    icon: UserCheck,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-border/80 bg-card/60 backdrop-blur-sm min-h-[calc(100vh-4rem)] p-4 justify-between">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Portal Menu
          </p>
          <nav className="mt-2 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-primary-foreground/80" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Phase 1 Verification Status info card */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center space-x-2 text-primary font-semibold text-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>Auth & RLS Active</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Your profile is secured by PostgreSQL Row Level Security. Only authorized recruiters and you have access.
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Role status</span>
            <Badge variant="success" className="text-[10px] px-1.5 py-0">
              Verified Student
            </Badge>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground flex items-center space-x-2">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <span className="truncate">Placement Hub v1.0 • Foundation</span>
      </div>
    </aside>
  );
}
