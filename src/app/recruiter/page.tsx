import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Building2,
  Briefcase,
  Users,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Globe,
  FileCheck,
  ExternalLink,
  Award,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state-views";
import type { Profile, Company } from "@/types/database";
function parseSalaryToINR(pkg: string | null | undefined): number | null {
  if (!pkg) return null;
  const clean = pkg.toLowerCase().replace(/,/g, "").trim();
  const lpaMatch = clean.match(/([\d.]+)\s*(?:-|to)?\s*([\d.]*)\s*(?:lpa|lakh|lac)/);
  if (lpaMatch) {
    const val1 = parseFloat(lpaMatch[1]);
    const val2 = lpaMatch[2] ? parseFloat(lpaMatch[2]) : val1;
    return ((val1 + val2) / 2) * 100000;
  }
  const numMatch = clean.match(/\d[\d.]*/);
  if (numMatch) {
    const val = parseFloat(numMatch[0]);
    if (val > 0 && val < 100) return val * 100000;
    if (val >= 100) return val;
  }
  return null;
}

function formatSalaryINR(amount: number): string {
  if (amount === 0) return "—";
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} LPA`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default async function RecruiterDashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect("/auth/login?redirect=/recruiter");
  }

  // 1. Fetch profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as Profile | null;
  const role = profile?.role || "student";
  const fullName = profile?.full_name || (user?.user_metadata?.full_name as string) || "Recruiter";

  // 2. Fetch recruiter membership
  const { data: membershipData } = await supabase
    .from("recruiter_memberships")
    .select("*, companies:company_id(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  const membership = membershipData as any;
  const isVerifiedRecruiter =
    role === "administrator" || (role === "recruiter" && membership?.is_verified === true) || role === "recruiter";
  const isPending = !isVerifiedRecruiter;

  // 3. Fetch company information
  let company: Company | null = membership?.companies || null;
  if (!company) {
    const { data: comp } = await supabase
      .from("companies")
      .select("*")
      .eq("created_by", user.id)
      .maybeSingle();
    company = comp as Company | null;
  }

  const companyName =
    company?.name || membership?.company_name || (user?.user_metadata?.company_name as string) || "Hiring Partner Organization";
  const designation =
    membership?.designation || (user?.user_metadata?.designation as string) || "Campus Talent Partner";

  // 4. Fetch recruiter's jobs and internships
  const { data: jobsData } = await supabase
    .from("jobs")
    .select("id, title, status, approval_status, salary_package, created_at")
    .eq("recruiter_id", user.id);

  const { data: internshipsData } = await supabase
    .from("internships")
    .select("id, title, status, approval_status, stipend, duration, created_at")
    .eq("recruiter_id", user.id);

  const jobs = jobsData || [];
  const internships = internshipsData || [];

  const activeJobsCount = jobs.filter(
    (j) => j.status === "published" || j.status === "Open"
  ).length;
  const activeInternshipsCount = internships.filter(
    (i) => i.status === "published" || i.status === "Open"
  ).length;
  const totalListings = jobs.length + internships.length;

  const jobIds = jobs.map((j) => j.id);
  const internshipIds = internships.map((i) => i.id);

  // 5. Fetch applications for recruiter's listings
  let applications: any[] = [];
  let shortlistedCount = 0;

  if (jobIds.length > 0 || internshipIds.length > 0) {
    let query = supabase.from("applications").select(`
      id,
      job_id,
      internship_id,
      status,
      created_at,
      profiles:student_id (full_name, email),
      jobs:job_id (title),
      internships:internship_id (title)
    `);

    if (jobIds.length > 0 && internshipIds.length > 0) {
      query = query.or(`job_id.in.(${jobIds.join(",")}),internship_id.in.(${internshipIds.join(",")})`);
    } else if (jobIds.length > 0) {
      query = query.in("job_id", jobIds);
    } else {
      query = query.in("internship_id", internshipIds);
    }

    const { data: appData } = await query.order("created_at", { ascending: false });
    applications = appData || [];
    shortlistedCount = applications.filter(
      (a) => a.status === "Shortlisted" || a.status === "Interview" || a.status === "Selected"
    ).length;
  }

  const pendingApprovalsCount =
    jobs.filter((j) => j.approval_status === "pending").length +
    internships.filter((i) => i.approval_status === "pending").length;

  const awaitingReviewCount = applications.filter(
    (a) => a.status === "Applied" || a.status === "Under Review"
  ).length;

  const rejectedCount = applications.filter(
    (a) => a.status === "Rejected"
  ).length;

  const salaryNumbers = jobs
    .map((j) => parseSalaryToINR(j.salary_package))
    .filter((n): n is number => n !== null);

  const totalSalaryOffered = salaryNumbers.reduce((a, b) => a + b, 0);
  const avgSalaryOffered =
    salaryNumbers.length > 0 ? Math.round(totalSalaryOffered / salaryNumbers.length) : 0;

  const recentApplications = applications.slice(0, 5);
  const recentJobs = [...jobs, ...internships]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-primary/95 to-slate-900 p-6 sm:p-8 text-primary-foreground shadow-xl border border-primary/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {isVerifiedRecruiter ? (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-semibold flex items-center">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Verified Hiring Partner
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-semibold flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Pending Institutional Verification
                </Badge>
              )}

              <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground text-xs">
                {companyName}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {fullName}
            </h1>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              {designation} &bull; Manage campus recruitment drives, review candidate qualifications, and coordinate placement rounds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" asChild className="shadow-sm">
              <Link href="/recruiter/jobs/new" className="flex items-center space-x-1.5">
                <Plus className="h-4 w-4" />
                <span>Post Opportunity</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
              <Link href="/recruiter/jobs">Manage Listings</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
              <Link href="/recruiter/analytics">Salary Analytics</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Pending Verification Notice */}
      {isPending && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 sm:p-5 flex items-start space-x-3.5">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">
                Recruiter Account Awaiting Institutional Activation
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your recruiter membership for <strong>{companyName}</strong> has been registered. 
                In compliance with campus placement rules, an administrator must verify your corporate credentials before postings can be displayed to students. You can explore the workspace and prepare job openings in the meantime.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total & Active Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Jobs Posted
            </CardTitle>
            <Briefcase className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">{jobs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <strong className="text-foreground">{activeJobsCount}</strong> active {activeJobsCount === 1 ? "vacancy" : "vacancies"}
            </p>
          </CardContent>
        </Card>

        {/* Active Vacancies (Jobs + Internships) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Vacancies
            </CardTitle>
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">{activeJobsCount + activeInternshipsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalListings} total opportunities published
            </p>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Job Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-extrabold ${pendingApprovalsCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
              {pendingApprovalsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingApprovalsCount === 0 ? "All listings approved" : "Awaiting administrator review"}
            </p>
          </CardContent>
        </Card>

        {/* Total Applications Received */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Applications
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">{applications.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all campus drives
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics: Pipeline & Salary Compensation */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Applications Awaiting Review */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Awaiting Review
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-orange-500">{awaitingReviewCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending recruiter screening
            </p>
          </CardContent>
        </Card>

        {/* Shortlisted / Interview Candidates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Shortlisted Candidates
            </CardTitle>
            <FileCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {shortlistedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Advanced in interview pipeline
            </p>
          </CardContent>
        </Card>

        {/* Rejected Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rejected Applications
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-muted-foreground">
              {rejectedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ineligible or archived
            </p>
          </CardContent>
        </Card>

        {/* Average Salary Offered */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avg. Salary Package
            </CardTitle>
            <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatSalaryINR(avgSalaryOffered)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {salaryNumbers.length > 0 ? `Total: ${formatSalaryINR(totalSalaryOffered)} offered` : "No salary data recorded"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Status & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Company Status Card */}
        <Card className="md:col-span-1 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Hiring Organization</span>
              </CardTitle>
              {company?.is_verified ? (
                <Badge variant="success" className="text-[10px] py-0">Verified</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] py-0 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10">Pending</Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Corporate profile details for campus placement drives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div>
              <p className="font-semibold text-sm text-foreground">{companyName}</p>
              <p className="text-muted-foreground">{company?.industry || "Technology & Services"}</p>
            </div>

            {company?.location && (
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                <span className="truncate">{company.location}</span>
              </div>
            )}

            {company?.website && (
              <div className="flex items-center text-muted-foreground">
                <Globe className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-primary hover:underline flex items-center"
                >
                  <span>{company.website.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="h-2.5 w-2.5 ml-1" />
                </a>
              </div>
            )}
          </CardContent>
          <div className="p-6 pt-0">
            <Button variant="outline" size="sm" asChild className="w-full text-xs">
              <Link href="/recruiter/company">
                {company ? "Update Company Details" : "Register Organization Profile"}
              </Link>
            </Button>
          </div>
        </Card>

        {/* Quick Links & Actions Grid */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recruitment Quick Actions</CardTitle>
            <CardDescription className="text-xs">
              Streamlined workflows for managing campus recruitment drives
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/recruiter/jobs/new"
              className="group p-4 rounded-xl border border-border bg-card/60 hover:bg-accent/50 hover:border-primary/40 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Plus className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="font-semibold text-sm text-foreground">Post New Opportunity</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Publish a job or internship drive with automated AI description parsing.
              </p>
            </Link>

            <Link
              href="/recruiter/jobs"
              className="group p-4 rounded-xl border border-border bg-card/60 hover:bg-accent/50 hover:border-primary/40 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Briefcase className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="font-semibold text-sm text-foreground">Candidate Pipelines</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Review applicants, inspect qualifications, and advance candidates through interview stages.
              </p>
            </Link>

            <Link
              href="/recruiter/applications"
              className="group p-4 rounded-xl border border-border bg-card/60 hover:bg-accent/50 hover:border-primary/40 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="font-semibold text-sm text-foreground">Review All Applications</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Filter applicants by status, check academic eligibility, and manage recruitment stages.
              </p>
            </Link>

            <Link
              href="/recruiter/analytics"
              className="group p-4 rounded-xl border border-border bg-card/60 hover:bg-accent/50 hover:border-primary/40 transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="font-semibold text-sm text-foreground">Salary & Hiring Analytics</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Analyze compensation trends, recruitment funnel drop-offs, and hiring yield metrics.
              </p>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Job Postings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Recent Job & Vacancy Postings</h2>
            <p className="text-xs text-muted-foreground">
              Your organization&apos;s latest published opportunities and opening status
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link href="/recruiter/jobs" className="flex items-center space-x-1">
              <span>Manage All Postings</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {recentJobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center space-y-3">
              <Briefcase className="h-9 w-9 text-muted-foreground mx-auto opacity-50" />
              <p className="text-sm font-semibold text-foreground">No openings posted yet</p>
              <Button size="sm" asChild>
                <Link href="/recruiter/jobs/new">Create Your First Vacancy</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {recentJobs.map((item: any) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-accent/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-foreground">{item.title}</span>
                      <Badge variant="outline" className="text-[10px] py-0 capitalize">
                        {item.status || "published"}
                      </Badge>
                      {item.approval_status === "approved" ? (
                        <Badge variant="success" className="text-[10px] py-0">Approved</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0 border-amber-500/30 text-amber-600 bg-amber-500/10">Pending Review</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.salary_package || item.stipend || "Competitive Compensation"} &bull; Posted on {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" asChild className="text-xs">
                      <Link href={`/recruiter/jobs/${item.id}/applications${item.duration ? "?type=internship" : ""}`}>
                        View Applicants
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Recent Applications Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Recent Candidate Submissions</h2>
            <p className="text-xs text-muted-foreground">
              Latest applications received across your active placement drives
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link href="/recruiter/applications" className="flex items-center space-x-1">
              <span>View All Applications</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {recentApplications.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-3">
              <Users className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">No candidate applications yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When students apply to your open jobs or internships, their submissions and eligibility records will appear here.
                </p>
              </div>
              <Button size="sm" variant="outline" asChild className="mt-2">
                <Link href="/recruiter/jobs/new">Create Your First Listing</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {recentApplications.map((app) => {
                const listingTitle = app.jobs?.title || app.internships?.title || "Placement Opportunity";
                const studentName = app.profiles?.full_name || "Student Candidate";
                const studentEmail = app.profiles?.email || "";
                const listingId = app.job_id || app.internship_id;
                const typeParam = app.internship_id ? "?type=internship" : "";

                return (
                  <div
                    key={app.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-foreground">{studentName}</span>
                        <Badge variant="outline" className="text-[10px] py-0 capitalize">
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Applied for <strong className="text-foreground">{listingTitle}</strong> &bull; {studentEmail}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" asChild className="text-xs">
                        <Link href={`/recruiter/jobs/${listingId}/applications${typeParam}`}>
                          Review Candidate
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
