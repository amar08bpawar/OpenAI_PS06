import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-card/40 py-12">
      <div className="container grid gap-8 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">Placement Hub</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Campus placement and recruitment platform connecting students with opportunities through verified skill signals, OTP authentication, and transparent role-based access.
          </p>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Secured with Supabase Auth & PostgreSQL RLS</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">Navigation</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/auth/login" className="hover:text-foreground transition-colors">
                Candidate Login
              </Link>
            </li>
            <li>
              <Link href="/auth/register" className="hover:text-foreground transition-colors">
                Student Registration
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">Security & Roles</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="text-xs">Student Self-Service</li>
            <li className="text-xs">Recruiter Verification</li>
            <li className="text-xs">Admin Access Control</li>
            <li className="text-xs">Email OTP Verification</li>
          </ul>
        </div>
      </div>

      <div className="container mt-8 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Placement Hub. All rights reserved.</p>
        <p className="mt-2 sm:mt-0 flex items-center">
          Crafted with Next.js App Router, Tailwind CSS, and Supabase
        </p>
      </div>
    </footer>
  );
}
