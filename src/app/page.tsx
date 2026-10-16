import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  ShieldCheck,
  KeyRound,
  Github,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Building2,
  Users,
  Compass,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-28 border-b border-border/60 bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container relative z-10 mx-auto max-w-5xl text-center space-y-6">
            <div className="inline-flex items-center space-x-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Phase 1 Foundation Live • Campus Recruitment Architecture</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
              Intelligent Campus Placements, Powered by{" "}
              <span className="text-primary underline decoration-primary/40 underline-offset-8">
                Verified Skill Signals
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Placement Hub bridges the gap between students and top campus recruiters with email OTP authentication, tamper-proof role-based access control, and authentic skill verification.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="w-full sm:w-auto shadow-md" asChild>
                <Link href="/auth/register" className="flex items-center space-x-2">
                  <span>Register as Student</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/auth/login">Access Candidate Portal</Link>
              </Button>
            </div>

            {/* Quick Proof Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Supabase Auth & PostgreSQL RLS</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <KeyRound className="h-4 w-4 text-primary" />
                <span>Email OTP Verification</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Lock className="h-4 w-4 text-purple-600" />
                <span>Role Escalation Guards</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section id="features" className="py-20 bg-muted/20">
          <div className="container mx-auto max-w-6xl space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
                Architecture
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Engineered for High-Integrity Placements
              </h2>
              <p className="text-sm text-muted-foreground">
                Every component is built with enterprise standards, secure defaults, and reliable session persistence.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-border/80 hover:shadow-md transition-all">
                <CardHeader>
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Supported Supabase OTP Auth</CardTitle>
                  <CardDescription>
                    End-to-end email OTP sign up, verification, password resets, and session recovery with automatic token refresh.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                      6-digit OTP verification codes
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                      Secure cookie sessions with `@supabase/ssr`
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                      App Router middleware route protection
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/80 hover:shadow-md transition-all">
                <CardHeader>
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 mb-2">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">PostgreSQL RLS & Role Isolation</CardTitle>
                  <CardDescription>
                    Multi-tier user role model separating students, recruiters, and platform administrators at the database level.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                      Database triggers block self-promotion
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                      Students view and update only own data
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                      Server-side validation and admin authorization
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/80 hover:shadow-md transition-all">
                <CardHeader>
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 mb-2">
                    <Github className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Skill Signals Foundation</CardTitle>
                  <CardDescription>
                    Structured student profile schemas prepared for GitHub repository signals, aptitude scores, and semantic matching.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                      Course, branch, and CGPA tracking
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                      GIN indexed skills arrays in PostgreSQL
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                      Public GitHub username integration
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Roles Section */}
        <section id="roles" className="py-20 border-b border-border/60">
          <div className="container mx-auto max-w-6xl space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="outline" className="text-xs uppercase tracking-wider font-semibold">
                Access Control
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Three Distinct Roles, Zero Privilege Escalation
              </h2>
              <p className="text-sm text-muted-foreground">
                Placement Hub enforces strict role separation so that public users can never tamper with permissions.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-base">Student</h3>
                  </div>
                  <Badge variant="success">Default</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Created automatically on public registration. Can edit their personal academic credentials, submit skill signals, and view applied listings.
                </p>
                <div className="text-xs bg-muted/60 rounded-md p-2.5 text-muted-foreground">
                  <strong>Constraint:</strong> Cannot access recruiter management or elevate own role.
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-base">Recruiter</h3>
                  </div>
                  <Badge variant="info">Verified</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Corporate hiring managers linked to company memberships. Requires administrator verification before accessing candidate profiles.
                </p>
                <div className="text-xs bg-muted/60 rounded-md p-2.5 text-muted-foreground">
                  <strong>Constraint:</strong> Verification status protected by database triggers.
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-base">Administrator</h3>
                  </div>
                  <Badge variant="outline" className="border-purple-300 text-purple-700">Governance</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Campus placement officers and coordinators. Governs recruiter memberships, audits role elevations, and oversees campus placement drives.
                </p>
                <div className="text-xs bg-muted/60 rounded-md p-2.5 text-muted-foreground">
                  <strong>Constraint:</strong> Managed only via server-side service role execution.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="py-20 text-center bg-gradient-to-t from-primary/10 via-background to-background">
          <div className="container mx-auto max-w-3xl space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Ready to Establish Your Placement Profile?
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl mx-auto">
              Join students across courses and programs. Set up your credentials and verified email to get ready for campus opportunities.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/auth/register">Create Student Account</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth/login">Sign in with Email & OTP</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
