import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  MapPin,
  Building2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export default async function RecruiterAnalyticsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect("/auth/login?redirect=/recruiter/analytics");
  }

  // 1. Fetch user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "recruiter" && profile?.role !== "administrator") {
    redirect("/dashboard");
  }

  // 2. Fetch jobs and internships
  const { data: jobsData } = await supabase
    .from("jobs")
    .select("id, title, salary_package, work_mode, location, status, created_at")
    .eq("recruiter_id", user.id);

  const { data: internshipsData } = await supabase
    .from("internships")
    .select("id, title, stipend, duration, work_mode, location, status, created_at")
    .eq("recruiter_id", user.id);

  const jobs = jobsData || [];
  const internships = internshipsData || [];
  const jobIds = jobs.map((j) => j.id);
  const internshipIds = internships.map((i) => i.id);

  // 3. Fetch applications
  let applications: any[] = [];
  if (jobIds.length > 0 || internshipIds.length > 0) {
    let query = supabase.from("applications").select("id, job_id, internship_id, status, applied_at");
    if (jobIds.length > 0 && internshipIds.length > 0) {
      query = query.or(`job_id.in.(${jobIds.join(",")}),internship_id.in.(${internshipIds.join(",")})`);
    } else if (jobIds.length > 0) {
      query = query.in("job_id", jobIds);
    } else {
      query = query.in("internship_id", internshipIds);
    }
    const { data: appData } = await query;
    applications = appData || [];
  }

  // 4. Compute Salary Analytics
  const salaryValues = jobs
    .map((j) => parseSalaryToINR(j.salary_package))
    .filter((n): n is number => n !== null)
    .sort((a, b) => a - b);

  const totalSalary = salaryValues.reduce((a, b) => a + b, 0);
  const avgSalary = salaryValues.length > 0 ? Math.round(totalSalary / salaryValues.length) : 0;
  const minSalary = salaryValues.length > 0 ? salaryValues[0] : 0;
  const maxSalary = salaryValues.length > 0 ? salaryValues[salaryValues.length - 1] : 0;

  // Compute Median
  let medianSalary = 0;
  if (salaryValues.length > 0) {
    const mid = Math.floor(salaryValues.length / 2);
    medianSalary =
      salaryValues.length % 2 !== 0
        ? salaryValues[mid]
        : Math.round((salaryValues[mid - 1] + salaryValues[mid]) / 2);
  }

  // Work Mode Distribution
  const workModeCounts: Record<string, number> = {
    "On-site": 0,
    Remote: 0,
    Hybrid: 0,
  };
  jobs.forEach((j) => {
    const mode = j.work_mode || "On-site";
    workModeCounts[mode] = (workModeCounts[mode] || 0) + 1;
  });
  internships.forEach((i) => {
    const mode = i.work_mode || "On-site";
    workModeCounts[mode] = (workModeCounts[mode] || 0) + 1;
  });

  // Funnel Counts
  const totalApplied = applications.length;
  const shortlistedCount = applications.filter((a) =>
    ["Shortlisted", "Interview", "Selected"].includes(a.status)
  ).length;
  const interviewCount = applications.filter((a) =>
    ["Interview", "Selected"].includes(a.status)
  ).length;
  const selectedCount = applications.filter((a) => a.status === "Selected").length;
  const rejectedCount = applications.filter((a) => a.status === "Rejected").length;

  const totalOpenings = jobs.length + internships.length;
  const appsPerOpening =
    totalOpenings > 0 ? (totalApplied / totalOpenings).toFixed(1) : "0.0";

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-primary font-semibold mb-1">
            <TrendingUp className="h-4 w-4" />
            <span>Compensation & Pipeline Intelligence</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Recruiter Salary & Hiring Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time compensation benchmarks, applicant yield conversion, and recruitment funnel insights.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/recruiter/jobs">Manage Listings</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/recruiter/jobs/new">Post Opening</Link>
          </Button>
        </div>
      </div>

      {/* Salary Benchmark Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Average Salary Package
            </CardTitle>
            <Award className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">
              {formatSalaryINR(avgSalary)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all full-time postings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Median Salary Offer
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {formatSalaryINR(medianSalary)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">50th percentile compensation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Compensation Range
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {minSalary > 0 ? `${formatSalaryINR(minSalary)} – ${formatSalaryINR(maxSalary)}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Min to max packages offered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Applications per Opening
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-purple-600">{appsPerOpening}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalApplied} total applicant pool</p>
          </CardContent>
        </Card>
      </div>

      {/* Recruitment Funnel & Yield Conversion */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recruitment Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Candidate Recruitment Funnel</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Conversion rate across screening and interview rounds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Applied */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground">1. Total Applied</span>
                <span className="text-muted-foreground">{totalApplied} (100%)</span>
              </div>
              <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full w-full" />
              </div>
            </div>

            {/* Step 2: Shortlisted */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground">2. Shortlisted for Rounds</span>
                <span className="text-muted-foreground">
                  {shortlistedCount} (
                  {totalApplied > 0 ? Math.round((shortlistedCount / totalApplied) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{
                    width: `${totalApplied > 0 ? (shortlistedCount / totalApplied) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Step 3: Interviewed */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground">3. Technical / HR Interview</span>
                <span className="text-muted-foreground">
                  {interviewCount} (
                  {totalApplied > 0 ? Math.round((interviewCount / totalApplied) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all"
                  style={{
                    width: `${totalApplied > 0 ? (interviewCount / totalApplied) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Step 4: Selected */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground">4. Final Offers Extended</span>
                <span className="text-emerald-600 font-semibold">
                  {selectedCount} (
                  {totalApplied > 0 ? Math.round((selectedCount / totalApplied) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{
                    width: `${totalApplied > 0 ? (selectedCount / totalApplied) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Mode & Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Listing Distribution by Work Mode</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Breakdown of opportunities by workplace arrangement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(workModeCounts).map(([mode, count]) => {
              const pct = totalOpenings > 0 ? Math.round((count / totalOpenings) * 100) : 0;
              return (
                <div key={mode} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-foreground">{mode}</span>
                    <span className="text-muted-foreground">
                      {count} openings ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary/80 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Opportunities Active:</span>
              <strong className="text-foreground font-semibold">{totalOpenings}</strong>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listing Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listing Performance & Applicant Yield</CardTitle>
          <CardDescription className="text-xs">
            Individual breakdown of salary offered and applicant count per opening
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No job postings created yet. Create a job to begin gathering recruitment analytics.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map((job) => {
                const jobApps = applications.filter((a) => a.job_id === job.id);
                const selected = jobApps.filter((a) => a.status === "Selected").length;
                const shortlisted = jobApps.filter((a) =>
                  ["Shortlisted", "Interview"].includes(a.status)
                ).length;

                return (
                  <div
                    key={job.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-foreground">{job.title}</span>
                        <Badge variant="outline" className="text-[10px] py-0 capitalize">
                          {job.work_mode}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Package: <strong className="text-foreground">{job.salary_package}</strong> &bull; Location: {job.location}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="font-bold text-foreground">{jobApps.length}</span>
                        <span className="text-muted-foreground ml-1">applicants</span>
                      </div>
                      <Badge variant="secondary" className="text-[11px]">
                        {shortlisted} in review
                      </Badge>
                      {selected > 0 && (
                        <Badge variant="success" className="text-[11px]">
                          {selected} selected
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
