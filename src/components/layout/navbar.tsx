import React from "react";
import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">
            Placement<span className="text-primary">Hub</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-muted-foreground">
          <Link href="/jobs" className="hover:text-foreground transition-colors">
            Jobs
          </Link>
          <Link href="/internships" className="hover:text-foreground transition-colors">
            Internships
          </Link>
          <Link href="/companies" className="hover:text-foreground transition-colors">
            Companies
          </Link>
          <Link href="/#roles" className="hover:text-foreground transition-colors">
            Roles & RLS
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/register" className="flex items-center space-x-1">
              <span>Register</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
