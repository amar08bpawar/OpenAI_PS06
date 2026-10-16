"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, Bell } from "lucide-react";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types/database";

interface DashboardHeaderProps {
  profile: Partial<Profile> | null;
}

export function DashboardHeader({ profile }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <MobileNav />
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg tracking-tight text-foreground">
                Placement<span className="text-primary">Hub</span>
              </span>
              <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] py-0 px-1.5">
                Portal
              </Badge>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          </button>
          <div className="h-6 w-px bg-border" />
          <ProfileMenu profile={profile} />
        </div>
      </div>
    </header>
  );
}
