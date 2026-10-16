import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Users,
  Briefcase,
  Building2,
  Calendar,
  Award,
  GraduationCap,
  ArrowLeft,
  Mail,
  Phone,
  Github,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { checkEligibility } from "@/lib/services/eligibility";
import { updateApplicationStatus } from "@/app/actions/applications";
import type { ApplicationStatus } from "@/types/database";

interface RecruiterApplicationsPageProps {
  params: {
    id: string;
  };
  searchParams: {
    type?: string;
  };
}

export default async function RecruiterApplicationsPage({
  params,
  searchParams,
}: RecruiterApplicationsPageProps) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect("/auth/login");
  }

  const isInternship = searchParams.type === "internship";
  const table = isInternship ? "internships" : "jobs";

  // 1. Fetch listing details and verify ownership
  const { data: listingData, error: listingError } = await supabase
    .from(table)
    .select(`
      *,
      companies:company_id (name)
    `)
    .eq("id", params.id)
    .single();

  if (listingError || !listingData) {
    notFound();
  }

  const listing = listingData as any;

  // Verify that the current user is the recruiter or admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (listing.recruiter_id !== user.id && profile?.role !== "administrator") {
    redirect("/recruiter/jobs");
  }

  // 2. Fetch applications for this listing
  const foreignKey = isInternship ? "internship_id" : "job_id";
  const { data: applicationsData } = await supabase
    .from("applications")
    .select(`
      id,
      student_id,
      status,
      type,
      applied_at,
      notes,
      student:student_id (
        id,
        full_name,
        email
      )
    `)
    .eq(foreignKey, params.id)
    .order("applied_at", { ascending: false });

  const applications = (applicationsData as any[]) || [];

  // Fetch student details for all applicants
  const studentIds = applications.map((a) => a.student_id);
  let studentDetailsMap: Record<string, any> = {};

  if (studentIds.length > 0) {
    const { data: detailsData } = await supabase
      .from("student_details")
      .select("*")
      .in("user_id", studentIds);

    if (detailsData) {
      detailsData.forEach((d) => {
        studentDetailsMap[d.user_id] = d;
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="container max-w-5xl mx-auto space-y-8">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/recruiter/jobs" className="flex items-center text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to Recruiter Workspace
            </Link>
          </Button>

          {/* Header */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs text-primary font-semibold">
                  {listing.companies?.name}
                </Badge>
                <Badge variant="secondary" className="text-xs capitalize">
                  {listing.status}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Applicants: {listing.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                Review candidate credentials, automated eligibility scores, and update candidate placement pipeline stages.
              </p>
            </div>

            <Badge variant="outline" className="text-sm px-3 py-1 font-semibold">
              {applications.length} Total Applicant{applications.length === 1 ? "" : "s"}
            </Badge>
          </div>

          {/* Applications list */}
          {applications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-3 mx-auto opacity-40" />
                <h3 className="font-semibold text-base">No candidate applications yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Applications will appear here as eligible students discover and apply for this opening.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const student = app.student;
                const details = studentDetailsMap[app.student_id];
                const eligibility = checkEligibility(listing, details);
                const appliedDate = new Date(app.applied_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <Card key={app.id} className="border-border/80 hover:shadow-sm transition-all">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2.5">
                            <h3 className="font-bold text-lg text-foreground">
                              {student?.full_name || "Applicant"}
                            </h3>
                            {eligibility.isEligible ? (
                              <Badge variant="success" className="text-[11px] flex items-center space-x-1">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Eligible ({eligibility.matchPercentage}%)</span>
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[11px] flex items-center space-x-1">
                                <XCircle className="h-3 w-3" />
                                <span>Ineligible ({eligibility.unmetReasons.length} Unmet)</span>
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                            <span>{student?.email}</span>
                            {details?.phone && (
                              <>
                                <span>•</span>
                                <span>{details.phone}</span>
                              </>
                            )}
                            {details?.college && (
                              <>
                                <span>•</span>
                                <span>{details.college}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>Applied {appliedDate}</span>
                          </div>
                        </div>

                        {/* Status update selector form */}
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            const newStatus = formData.get("status") as ApplicationStatus;
                            await updateApplicationStatus({
                              applicationId: app.id,
                              newStatus,
                            });
                          }}
                          className="flex items-center space-x-2"
                        >
                          <select
                            name="status"
                            defaultValue={app.status}
                            className="h-9 rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-semibold"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview">Interview</option>
                            <option value="Selected">Selected</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                          <Button type="submit" size="sm" variant="outline" className="h-9 text-xs">
                            Update Stage
                          </Button>
                        </form>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-3">
                      {/* Academic & Skills summary */}
                      <div className="grid gap-2 sm:grid-cols-4 p-3 rounded-lg bg-muted/30 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Degree & Batch:</span>
                          <span className="font-semibold text-foreground">
                            {details?.course || "Not specified"} ({details?.graduation_year || "N/A"})
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">CGPA:</span>
                          <span className="font-semibold text-foreground">
                            {details?.cgpa ? `${Number(details.cgpa).toFixed(2)} / 10.0` : "Not recorded"}
                          </span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-muted-foreground block text-[11px]">Technical Skills:</span>
                          <span className="font-medium text-foreground">
                            {details?.skills?.length ? details.skills.join(", ") : "None specified"}
                          </span>
                        </div>
                      </div>

                      {/* Unmet reasons if ineligible */}
                      {!eligibility.isEligible && eligibility.unmetReasons.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-destructive/10 text-xs text-destructive space-y-1">
                          <p className="font-semibold text-[11px]">Unmet Requirements:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                            {eligibility.unmetReasons.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Projects count & Github link */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span>
                          {details?.projects?.length || 0} Listed Project{details?.projects?.length === 1 ? "" : "s"}
                        </span>
                        {details?.github_username && (
                          <a
                            href={`https://github.com/${details.github_username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline flex items-center"
                          >
                            <Github className="h-3.5 w-3.5 mr-1" />
                            <span>@{details.github_username}</span>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
