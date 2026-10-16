"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  UserCheck,
  Briefcase,
  Sparkles,
  Building2,
  FileCheck,
  Brain,
  Bot,
  Compass,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    name: "Dashboard Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Academic Profile",
    href: "/dashboard/profile",
    icon: UserCheck,
  },
  {
    name: "My Applications",
    href: "/dashboard/applications",
    icon: FileCheck,
  },
  {
    name: "Aptitude Tests",
    href: "/dashboard/aptitude",
    icon: Brain,
  },
  {
    name: "AI Mock Interview",
    href: "/dashboard/interview",
    icon: Bot,
  },
  {
    name: "Career Guidance",
    href: "/dashboard/guidance",
    icon: Compass,
  },
  {
    name: "GitHub Skill Signals",
    href: "/dashboard/github",
    icon: Code2,
  },
  {
    name: "Placement Jobs",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    name: "Internships",
    href: "/internships",
    icon: Sparkles,
  },
  {
    name: "Companies",
    href: "/companies",
    icon: Building2,
  },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Navigation Menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="fixed inset-x-0 top-16 z-50 border-b border-border bg-background/95 backdrop-blur-md p-4 shadow-xl">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
