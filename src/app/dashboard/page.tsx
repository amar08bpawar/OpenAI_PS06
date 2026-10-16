import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Code2,
  Lock,
  Building2,
  AlertTriangle,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Profile, StudentDetails } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  let profile: Profile | null = null;
  let studentDetails: StudentDetails | null = null;

  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = p as Profile | null;

    const { data: s } = await supabase
      .from("student_details")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    studentDetails = s as StudentDetails | null;
  }

  // Count active applications
  let applicationsCount = 0;
  if (user) {
    const { count } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("student_id", user.id);
    applicationsCount = count || 0;
  }

  const fullName = profile?.full_name || (user?.user_metadata?.full_name as string) || "Student";
  const email = profile?.email || user?.email || "";
  const course = studentDetails?.course || (user?.user_metadata?.course as string) || "Course not recorded";
  const qualification = studentDetails?.qualification || (user?.user_metadata?.qualification as string) || "Undergraduate";
  const role = profile?.role || "student";
  const skillsCount = studentDetails?.skills?.length || 0;

  // Calculate profile completeness
  const fields = [
    fullName,
    email,
    studentDetails?.course,
    studentDetails?.qualification,
    studentDetails?.branch,
    studentDetails?.graduation_year,
    studentDetails?.cgpa,
    studentDetails?.github_username,
  ];
  const filledFields = fields.filter((f) => Boolean(f)).length;
  const completionPercentage = Math.round((filledFields / fields.length) * 100);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 sm:p-8 text-primary-foreground shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-transparent text-xs font-semibold">
              <GraduationCap className="h-3.5 w-3.5 mr-1" />
              Student Portal Active
            </Badge>
            <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground text-xs">
              Phase 1 Foundation
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {fullName}!
          </h1>
          <p className="text-primary-foreground/90 text-sm leading-relaxed">
            Your verified student profile is active. Keep your academic credentials and verified skill signals updated for upcoming recruitment drives.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Role & Access Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Assigned Role
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize text-foreground">
              {role}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <Lock className="h-3 w-3 mr-1 text-muted-foreground" />
              Protected by RLS Policies
            </p>
          </CardContent>
        </Card>

        {/* Profile Completion */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Profile Completeness
            </CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {completionPercentage}%
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Applications */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Applications
            </CardTitle>
            <Briefcase className="h-4 w-4 text-sky-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {applicationsCount}
            </div>
            <Link
              href="/dashboard/applications"
              className="text-xs text-primary hover:underline mt-1 inline-flex items-center"
            >
              <span>View application status</span>
              <ArrowRight className="h-3 w-3 ml-0.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Skills & Qualifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Logged Skills
            </CardTitle>
            <Code2 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {skillsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {course.split(" ")[0]} • {qualification}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="hover:border-primary/40 transition-all p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Full-Time Jobs</h4>
              <p className="text-xs text-muted-foreground">Browse campus drives</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/jobs">Browse</Link>
          </Button>
        </Card>

        <Card className="hover:border-primary/40 transition-all p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Internships</h4>
              <p className="text-xs text-muted-foreground">Paid semester & summer</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/internships">Explore</Link>
          </Button>
        </Card>

        <Card className="hover:border-primary/40 transition-all p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Companies</h4>
              <p className="text-xs text-muted-foreground">Recruitment directory</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/companies">Directory</Link>
          </Button>
        </Card>
      </div>

      {/* Phase 3 AI & Skill Development Tools */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold tracking-tight">AI & Skill Development Workspace</h3>
            <p className="text-xs text-muted-foreground">
              Aptitude preparation, simulated mock interviews, career guidance, and GitHub evidence.
            </p>
          </div>
          <Badge variant="outline" className="text-[11px] font-mono border-primary/40 text-primary">
            Phase 3
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:border-primary transition-all p-4 flex flex-col justify-between">
            <div>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 w-fit mb-2">
                <Code2 className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-sm">Aptitude Tests</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Logical, Quantitative, Technical, and Verbal timed exams with deterministic grading.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="mt-4 w-full">
              <Link href="/dashboard/aptitude">Launch Test →</Link>
            </Button>
          </Card>

          <Card className="hover:border-primary transition-all p-4 flex flex-col justify-between">
            <div>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 w-fit mb-2">
                <UserCheck className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-sm">AI Mock Interview</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Realistic HR & technical interview simulation with instant labeled critique.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="mt-4 w-full">
              <Link href="/dashboard/interview">Practice Interview →</Link>
            </Button>
          </Card>

          <Card className="hover:border-primary transition-all p-4 flex flex-col justify-between">
            <div>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 w-fit mb-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-sm">Career Guidance</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Skill-gap analysis, readiness diagnostic, and customized preparation roadmaps.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="mt-4 w-full">
              <Link href="/dashboard/guidance">Analyze Readiness →</Link>
            </Button>
          </Card>

          <Card className="hover:border-primary transition-all p-4 flex flex-col justify-between">
            <div>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 w-fit mb-2">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-sm">GitHub Skill Signals</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Extract open-source repository footprints and language distributions.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="mt-4 w-full">
              <Link href="/dashboard/github">Inspect Profile →</Link>
            </Button>
          </Card>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Academic Profile Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Academic Details</span>
              <Badge variant="outline" className="font-normal text-xs">
                Student Profile
              </Badge>
            </CardTitle>
            <CardDescription>
              Review your registered course and academic status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-medium text-foreground">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-foreground truncate max-w-[200px]">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Course:</span>
                <span className="font-medium text-foreground truncate max-w-[200px]">{course}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Qualification:</span>
                <span className="font-medium text-foreground">{qualification}</span>
              </div>
              {studentDetails?.branch && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Specialization / Branch:</span>
                  <span className="font-medium text-foreground">{studentDetails.branch}</span>
                </div>
              )}
              {studentDetails?.graduation_year && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Graduation Year:</span>
                  <span className="font-medium text-foreground">{studentDetails.graduation_year}</span>
                </div>
              )}
              {studentDetails?.cgpa && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cumulative CGPA:</span>
                  <span className="font-medium text-foreground">{studentDetails.cgpa} / 10.0</span>
                </div>
              )}
            </div>

            <Button asChild className="w-full">
              <Link href="/dashboard/profile" className="flex items-center justify-center">
                <span>Update Academic & Profile Details</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Security and User Roles Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Security & Role Enforcement</span>
              <Badge variant="success" className="text-xs">
                Strict RLS
              </Badge>
            </CardTitle>
            <CardDescription>
              How Placement Hub isolates student and recruiter data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start space-x-3 rounded-lg border border-border p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Public Registration Isolation</p>
                  <p className="text-xs mt-0.5">
                    Public signups always default strictly to the <strong>student</strong> role. Privileged roles cannot be self-assigned.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border border-border p-3">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">PostgreSQL Row Level Security</p>
                  <p className="text-xs mt-0.5">
                    Database policies enforce that students can view and update only their permitted profile fields.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border border-border p-3">
                <Building2 className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Recruiter & Admin Approval</p>
                  <p className="text-xs mt-0.5">
                    Recruiter memberships require verification by platform administrators before granting posting rights.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
