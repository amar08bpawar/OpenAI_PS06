import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { checkEligibility } from "@/lib/services/eligibility";
import { searchExternalJobs, type ExternalJob } from "@/lib/services/external-jobs";
import type { Job, StudentDetails } from "@/types/database";

interface JobsPageProps {
  searchParams: {
    q?: string;
    mode?: string;
    loc?: string;
    sort?: string;
    tab?: "campus" | "external";
  };
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  const currentTab = searchParams.tab || "campus";

  // 1. Fetch current student details if user is logged in
  let studentDetails: StudentDetails | null = null;
  let existingApplicationsMap: Record<string, string> = {};

  if (user) {
    const { data: sData } = await supabase
      .from("student_details")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    studentDetails = sData as StudentDetails | null;

    // Fetch existing job application IDs
    const { data: apps } = await supabase
      .from("applications")
      .select("job_id, status")
      .eq("student_id", user.id)
      .not("job_id", "is", null);

    if (apps) {
      apps.forEach((a) => {
        if (a.job_id) existingApplicationsMap[a.job_id] = a.status;
      });
    }
  }

  // 2. Query published & approved campus jobs with company data
  let query = supabase
    .from("jobs")
    .select(`
      *,
      companies:company_id (
        id,
        name,
        logo_url,
        location,
        industry
      )
    `)
    .eq("status", "published")
    .eq("approval_status", "approved");

  if (searchParams.mode && searchParams.mode !== "all") {
    query = query.eq("work_mode", searchParams.mode);
  }

  const { data: jobsData } = await query.order("created_at", { ascending: false });
  let jobs = (jobsData as any[]) || [];

  // Client-side text filter for search query
  const searchQuery = (searchParams.q || "").toLowerCase().trim();
  if (searchQuery) {
    jobs = jobs.filter((j) => {
      const titleMatch = j.title.toLowerCase().includes(searchQuery);
      const companyMatch = j.companies?.name?.toLowerCase().includes(searchQuery);
      const skillMatch = j.required_skills?.some((s: string) =>
        s.toLowerCase().includes(searchQuery)
      );
      return titleMatch || companyMatch || skillMatch;
    });
  }

  // Sorting
  if (searchParams.sort === "deadline") {
    jobs.sort(
      (a, b) =>
        new Date(a.application_deadline).getTime() -
        new Date(b.application_deadline).getTime()
    );
  } else if (searchParams.sort === "cgpa") {
    jobs.sort((a, b) => (a.min_cgpa || 0) - (b.min_cgpa || 0));
  }

  // 3. Fetch external live vacancies
  const externalJobs = await searchExternalJobs({
    query: searchParams.q,
    workMode: searchParams.mode,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="container max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs text-primary font-semibold mb-1">
                <Briefcase className="h-4 w-4" />
                <span>Campus Opportunities</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Campus Placement Jobs
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Browse full-time campus placement drives with verified eligibility requirements.
              </p>
            </div>

            {user && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/applications">
                  View My Applications ({Object.keys(existingApplicationsMap).length})
                </Link>
              </Button>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-border/80 space-x-6">
            <Link
              href={`/jobs?tab=campus${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ""}${searchParams.mode ? `&mode=${searchParams.mode}` : ""}`}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
                currentTab === "campus"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Campus Placement Drives ({jobs.length})</span>
            </Link>

            <Link
              href={`/jobs?tab=external${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ""}${searchParams.mode ? `&mode=${searchParams.mode}` : ""}`}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
                currentTab === "external"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>Live Off-Campus Vacancies ({externalJobs.length})</span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-purple-500/10 text-purple-600">
                Live Feed
              </Badge>
            </Link>
          </div>

          {/* Search & Filter Bar */}
          <form method="GET" className="grid gap-3 sm:grid-cols-4 p-4 rounded-xl bg-card border border-border shadow-sm">
            <input type="hidden" name="tab" value={currentTab} />
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={searchParams.q || ""}
                placeholder="Search job title, company, or required skill..."
                className="pl-9"
              />
            </div>

            <div>
              <select
                name="mode"
                defaultValue={searchParams.mode || "all"}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Work Modes</option>
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <select
                name="sort"
                defaultValue={searchParams.sort || "newest"}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="newest">Newest First</option>
                <option value="deadline">Approaching Deadline</option>
                <option value="cgpa">Lowest CGPA Cutoff</option>
              </select>
              <Button type="submit" size="sm" className="h-10 px-4">
                Filter
              </Button>
            </div>
          </form>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing {currentTab === "campus" ? jobs.length : externalJobs.length} {currentTab === "campus" ? "campus" : "live off-campus"} position{(currentTab === "campus" ? jobs.length : externalJobs.length) === 1 ? "" : "s"}
            </span>
            {user && currentTab === "campus" && (
              <span className="text-primary flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Live eligibility calculation active
              </span>
            )}
          </div>

          {/* CAMPUS JOBS TAB */}
          {currentTab === "campus" && (
            <>
              {jobs.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                    <Briefcase className="h-10 w-10 text-muted-foreground opacity-40" />
                    <h3 className="font-semibold text-base">No active campus drives matching this query</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      New campus recruitment drives are published regularly by our institutional hiring partners. In the meantime, explore live off-campus openings!
                    </p>
                    <div className="flex items-center space-x-3 pt-2">
                      <Button variant="default" size="sm" asChild>
                        <Link href="/jobs?tab=external">
                          Explore {externalJobs.length} Live Off-Campus Vacancies
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/jobs?tab=campus">Reset Filters</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {jobs.map((job) => {
                    const companyName = job.companies?.name || "Campus Recruiter";
                    const eligibility = user ? checkEligibility(job, studentDetails) : null;
                    const existingStatus = existingApplicationsMap[job.id];
                    const deadline = new Date(job.application_deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <Card key={job.id} className="hover:shadow-md transition-all border-border/80 flex flex-col justify-between">
                        <CardHeader className="p-5 pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-primary flex items-center">
                                <Building2 className="h-3.5 w-3.5 mr-1" />
                                {companyName}
                              </span>
                              <CardTitle className="text-lg font-bold leading-tight line-clamp-1">
                                {job.title}
                              </CardTitle>
                            </div>
                            <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                              {job.work_mode}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">{job.salary_package}</span>
                            <span>•</span>
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-0.5" />
                              {job.location}
                            </span>
                          </div>
                        </CardHeader>

                        <CardContent className="p-5 pt-0 space-y-4">
                          {/* Required skills */}
                          {job.required_skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {job.required_skills.slice(0, 3).map((skill: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-2 font-normal">
                                  {skill}
                                </Badge>
                              ))}
                              {job.required_skills.length > 3 && (
                                <span className="text-[10px] text-muted-foreground self-center">
                                  +{job.required_skills.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Cutoff criteria */}
                          <div className="text-[11px] text-muted-foreground space-y-1 border-t border-border/60 pt-2.5">
                            <div className="flex justify-between">
                              <span>Min CGPA:</span>
                              <span className="font-medium text-foreground">
                                {job.min_cgpa > 0 ? `${job.min_cgpa.toFixed(1)}+` : "Any CGPA"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Deadline:</span>
                              <span className="font-medium text-foreground">{deadline}</span>
                            </div>
                          </div>

                          {/* Eligibility Badge */}
                          {user && (
                            <div className="pt-1 flex items-center justify-between">
                              {existingStatus ? (
                                <Badge variant="secondary" className="text-[11px]">
                                  Applied: {existingStatus}
                                </Badge>
                              ) : eligibility?.isEligible ? (
                                <Badge variant="success" className="text-[11px] flex items-center">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Eligible
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[11px] flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Not Eligible
                                </Badge>
                              )}
                            </div>
                          )}

                          <Button variant="outline" size="sm" asChild className="w-full mt-2">
                            <Link href={`/jobs/${job.id}`} className="flex items-center justify-center">
                              <span>View Details & Apply</span>
                              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* EXTERNAL LIVE VACANCIES TAB */}
          {currentTab === "external" && (
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  Live external tech opportunities curated for university students and early-career software professionals.
                </span>
                <Badge variant="outline" className="text-[10px] font-medium border-primary/30 text-primary">
                  Live Feed
                </Badge>
              </div>

              {externalJobs.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center space-y-2">
                    <p className="text-sm font-semibold">No external vacancies found</p>
                    <p className="text-xs text-muted-foreground">Try clearing your search terms or work mode filters.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {externalJobs.map((extJob) => (
                    <Card
                      key={extJob.id}
                      className="hover:shadow-md transition-all border-border/80 flex flex-col justify-between"
                    >
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-primary flex items-center">
                              <Building2 className="h-3.5 w-3.5 mr-1" />
                              {extJob.company}
                            </span>
                            <CardTitle className="text-lg font-bold leading-tight line-clamp-1">
                              {extJob.title}
                            </CardTitle>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                            {extJob.workMode}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground">
                          {extJob.salary && (
                            <span className="font-semibold text-foreground">{extJob.salary}</span>
                          )}
                          <span>•</span>
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-0.5" />
                            {extJob.location}
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="p-5 pt-0 space-y-4">
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {extJob.description}
                        </p>

                        {extJob.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {extJob.skills.slice(0, 4).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-2 font-normal">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="border-t border-border/60 pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Source: {extJob.source}</span>
                          <Badge variant="outline" className="text-[10px] py-0">
                            {extJob.type}
                          </Badge>
                        </div>

                        <Button size="sm" asChild className="w-full mt-2">
                          <a
                            href={extJob.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-1.5"
                          >
                            <span>Apply on Company Site</span>
                            <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
