import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Briefcase,
  Building2,
  Users,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state-views";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default async function RecruiterJobsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect("/auth/login?redirect=/recruiter/jobs");
  }

  // Verify role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "recruiter" && profile?.role !== "administrator") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container max-w-2xl mx-auto py-16 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Recruiter Access Required</h1>
          <p className="text-sm text-muted-foreground">
            Your current account has the &apos;student&apos; role. Job and candidate management requires an authorized recruiter or administrator account.
          </p>
          <Button asChild>
            <Link href="/dashboard">Return to Student Dashboard</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Fetch recruiter's jobs with applicant count
  const { data: jobsData } = await supabase
    .from("jobs")
    .select(`
      *,
      companies:company_id (name),
      applications:applications(count)
    `)
    .eq("recruiter_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch recruiter's internships with applicant count
  const { data: internshipsData } = await supabase
    .from("internships")
    .select(`
      *,
      companies:company_id (name),
      applications:applications(count)
    `)
    .eq("recruiter_id", user.id)
    .order("created_at", { ascending: false });

  const jobs = (jobsData as any[]) || [];
  const internships = (internshipsData as any[]) || [];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="container max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs text-primary font-semibold mb-1">
                <Briefcase className="h-4 w-4" />
                <span>Recruiter Workspace</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Manage Job & Internship Listings
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create openings, monitor applications, and manage student recruitment pipelines.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/recruiter/company">Company Profile</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/recruiter/jobs/new" className="flex items-center space-x-1">
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Post Opportunity</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Full-Time Jobs Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <span>Full-Time Placement Drives ({jobs.length})</span>
            </h2>

            {jobs.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">You haven&apos;t posted any full-time jobs yet.</p>
                  <Button size="sm" asChild>
                    <Link href="/recruiter/jobs/new">Create Your First Job Posting</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const applicantCount = job.applications?.[0]?.count || 0;
                  const deadline = new Date(job.application_deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <Card key={job.id} className="border-border/80 hover:shadow-sm transition-all">
                      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant={job.status === "published" ? "success" : "secondary"} className="text-[10px] capitalize">
                              {job.status}
                            </Badge>
                            <h3 className="font-bold text-base text-foreground">{job.title}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>{job.companies?.name}</span>
                            <span>•</span>
                            <span className="font-semibold text-foreground">{job.salary_package}</span>
                            <span>•</span>
                            <span>{job.work_mode}</span>
                            <span>•</span>
                            <span>Deadline: {deadline}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 self-end sm:self-center">
                          <Button variant="outline" size="sm" asChild className="h-9 text-xs">
                            <Link href={`/recruiter/jobs/${job.id}/applications`} className="flex items-center space-x-1.5">
                              <Users className="h-3.5 w-3.5 mr-1 text-primary" />
                              <span>Applicants ({applicantCount})</span>
                            </Link>
                          </Button>

                          <Button variant="ghost" size="sm" asChild className="h-9 text-xs">
                            <Link href={`/jobs/${job.id}`}>View Live</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Internships Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>Internship Drives ({internships.length})</span>
            </h2>

            {internships.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-xs text-muted-foreground">
                  No internships posted yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {internships.map((internship) => {
                  const applicantCount = internship.applications?.[0]?.count || 0;
                  const deadline = new Date(internship.application_deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <Card key={internship.id} className="border-border/80 hover:shadow-sm transition-all">
                      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant={internship.status === "published" ? "success" : "secondary"} className="text-[10px] capitalize">
                              {internship.status}
                            </Badge>
                            <h3 className="font-bold text-base text-foreground">{internship.title}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>{internship.companies?.name}</span>
                            <span>•</span>
                            <span className="font-semibold text-foreground">{internship.stipend} ({internship.duration})</span>
                            <span>•</span>
                            <span>{internship.work_mode}</span>
                            <span>•</span>
                            <span>Deadline: {deadline}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 self-end sm:self-center">
                          <Button variant="outline" size="sm" asChild className="h-9 text-xs">
                            <Link href={`/recruiter/jobs/${internship.id}/applications?type=internship`} className="flex items-center space-x-1.5">
                              <Users className="h-3.5 w-3.5 mr-1 text-primary" />
                              <span>Applicants ({applicantCount})</span>
                            </Link>
                          </Button>

                          <Button variant="ghost" size="sm" asChild className="h-9 text-xs">
                            <Link href={`/internships/${internship.id}`}>View Live</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
