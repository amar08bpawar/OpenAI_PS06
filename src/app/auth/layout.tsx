import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Top Header */}
      <header className="w-full border-b border-border/60 bg-background/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">
              Placement<span className="text-primary">Hub</span>
            </span>
          </Link>

          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Supabase Auth Verified</span>
          </div>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        Placement Hub • Campus Placement & Recruitment System
      </footer>
    </div>
  );
}
