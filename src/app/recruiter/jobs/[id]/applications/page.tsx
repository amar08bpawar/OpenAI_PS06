
import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Users,
  ArrowLeft,
  Github,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  // 1. Authenticate the current user.
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  const user = authData?.user;

  if (authError || !user) {
    redirect("/auth/login");
  }

  // 2. Verify the user's role.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    redirect("/dashboard");
  }

  const isAdministrator = profile.role === "administrator";

  if (profile.role !== "recruiter" && !isAdministrator) {
    redirect("/dashboard");
  }

  // 3. Recruiters must be verified.
  // Administrators can access this page without recruiter membership.
  if (!isAdministrator) {
    const { data: membership, error: membershipError } =
      await supabase
        .from("recruiter_memberships")
        .select("is_verified")
        .eq("user_id", user.id)
        .maybeSingle();

    if (membershipError || membership?.is_verified !== true) {
      redirect("/recruiter");
    }
  }

  // 4. Fetch the requested job or internship.
  const isInternship = searchParams.type === "internship";
  const table = isInternship ? "internships" : "jobs";

  const { data: listingData, error: listingError } = await supabase
    .from(table)
    .select(`
      *,
      companies:company_id (name)
    `)
    .eq("id", params.id)
    .maybeSingle();

  if (listingError || !listingData) {
    notFound();
  }

  const listing = listingData as any;

  // 5. Verify listing ownership before exposing applicant information.
  if (!isAdministrator && listing.recruiter_id !== user.id) {
    redirect("/recruiter/jobs");
  }

  // 6. Fetch applications only after authorization succeeds.
  const foreignKey = isInternship ? "internship_id" : "job_id";

  const { data: applicationsData, error: applicationsError } =
    await supabase
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

  if (applicationsError) {
    throw new Error("Unable to load applications. Please try again.");
  }

  const applications = (applicationsData as any[]) || [];

  // 7. Fetch applicant details.
  const studentIds = Array.from(
    new Set(
      applications
        .map((application) => application.student_id)
        .filter((id): id is string => typeof id === "string")
    )
  );

  let studentDetailsMap: Record<string, any> = {};

  if (studentIds.length > 0) {
    const { data: detailsData, error: detailsError } = await supabase
      .from("student_details")
      .select("*")
      .in("user_id", studentIds);

    if (detailsError) {
      throw new Error(
        "Unable to load applicant details. Please try again."
      );
    }

    if (detailsData) {
      detailsData.forEach((details) => {
        studentDetailsMap[details.user_id] = details;
      });
    }
  }

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="container mx-auto max-w-5xl space-y-8">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link
            href="/recruiter/jobs"
            className="flex items-center text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Recruiter Workspace
          </Link>
        </Button>

        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className="text-xs font-semibold text-primary"
              >
                {listing.companies?.name || "Company"}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {listing.status}
              </Badge>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Applicants: {listing.title}
            </h1>

            <p className="text-xs text-muted-foreground">
              Review candidate credentials, eligibility scores, and
              application stages.
            </p>
          </div>

          <Badge
            variant="outline"
            className="px-3 py-1 text-sm font-semibold"
          >
            {applications.length} Total Applicant
            {applications.length === 1 ? "" : "s"}
          </Badge>
        </div>

        {/* Applications */}
        {applications.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-40" />
              <h3 className="text-base font-semibold">
                No candidate applications yet
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Applications will appear here when students apply for this
                opening.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const student = app.student;
              const details = studentDetailsMap[app.student_id];
              const eligibility = checkEligibility(listing, details);

              const appliedDate = app.applied_at
                ? new Date(app.applied_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Unknown";

              return (
                <Card
                  key={app.id}
                  className="border-border/80 transition-all hover:shadow-sm"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="flex items-center space-x-2.5">
                          <h3 className="text-lg font-bold text-foreground">
                            {student?.full_name || "Applicant"}
                          </h3>

                          {eligibility.isEligible ? (
                            <Badge
                              variant="success"
                              className="flex items-center space-x-1 text-[11px]"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>
                                Eligible ({eligibility.matchPercentage}%)
                              </span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="flex items-center space-x-1 text-[11px]"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>
                                Ineligible (
                                {eligibility.unmetReasons.length} Unmet)
                              </span>
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                          <span>{student?.email || "Email unavailable"}</span>

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

                      {/* Application status update */}
                      <form
                        action={async (formData: FormData) => {
                          "use server";

                          const rawStatus = formData.get("status");

                          const allowedStatuses: ApplicationStatus[] = [
                            "Applied",
                            "Shortlisted",
                            "Interview",
                            "Selected",
                            "Rejected",
                          ];

                          if (
                            typeof rawStatus !== "string" ||
                            !allowedStatuses.includes(
                              rawStatus as ApplicationStatus
                            )
                          ) {
                            throw new Error("Invalid application status.");
                          }

                          await updateApplicationStatus({
                            applicationId: app.id,
                            newStatus: rawStatus as ApplicationStatus,
                          });
                        }}
                        className="flex items-center space-x-2"
                      >
                        <select
                          name="status"
                          defaultValue={app.status}
                          className="h-9 rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-semibold"
                          aria-label={`Application status for ${student?.full_name || "applicant"}`}
                        >
                          <option value="Applied">Applied</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Interview">Interview</option>
                          <option value="Selected">Selected</option>
                          <option value="Rejected">Rejected</option>
                        </select>

                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="h-9 text-xs"
                        >
                          Update Stage
                        </Button>
                      </form>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 p-5 pt-0">
                    {/* Academic and skills summary */}
                    <div className="grid gap-2 rounded-lg bg-muted/30 p-3 text-xs sm:grid-cols-4">
                      <div>
                        <span className="block text-[11px] text-muted-foreground">
                          Degree &amp; Batch:
                        </span>
                        <span className="font-semibold text-foreground">
                          {details?.course || "Not specified"} (
                          {details?.graduation_year || "N/A"})
                        </span>
                      </div>

                      <div>
                        <span className="block text-[11px] text-muted-foreground">
                          CGPA:
                        </span>
                        <span className="font-semibold text-foreground">
                          {details?.cgpa
                            ? `${Number(details.cgpa).toFixed(2)} / 10.0`
                            : "Not recorded"}
                        </span>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="block text-[11px] text-muted-foreground">
                          Technical Skills:
                        </span>
                        <span className="font-medium text-foreground">
                          {details?.skills?.length
                            ? details.skills.join(", ")
                            : "None specified"}
                        </span>
                      </div>
                    </div>

                    {/* Eligibility details */}
                    {!eligibility.isEligible &&
                      eligibility.unmetReasons.length > 0 && (
                        <div className="space-y-1 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                          <p className="text-[11px] font-semibold">
                            Unmet Requirements:
                          </p>
                          <ul className="list-inside list-disc space-y-0.5 text-[11px]">
                            {eligibility.unmetReasons.map(
                              (reason: string, index: number) => (
                                <li key={index}>{reason}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {/* Projects and GitHub */}
                    <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                      <span>
                        {details?.projects?.length || 0} Listed Project
                        {details?.projects?.length === 1 ? "" : "s"}
                      </span>

                      {details?.github_username && (
                        <a
                          href={`https://github.com/${encodeURIComponent(
                            details.github_username
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary hover:underline"
                        >
                          <Github className="mr-1 h-3.5 w-3.5" />
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
    </div>
  );
}
