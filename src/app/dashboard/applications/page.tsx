import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  Inbox,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state-views";
import { updateApplicationStatus } from "@/app/actions/applications";
import type { Application, ApplicationStatus } from "@/types/database";

export default async function StudentApplicationsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch applications for the authenticated student only (guaranteed by RLS and student_id filter)
  const { data: applicationsData, error } = await supabase
    .from("applications")
    .select(`
      id,
      student_id,
      type,
      status,
      applied_at,
      notes,
      job_id,
      internship_id,
      jobs:job_id (
        id,
        title,
        salary_package,
        location,
        work_mode,
        companies:company_id (
          id,
          name,
          location,
          industry
        )
      ),
      internships:internship_id (
        id,
        title,
        stipend,
        duration,
        location,
        work_mode,
        companies:company_id (
          id,
          name,
          location,
          industry
        )
      )
    `)
    .eq("student_id", user.id)
    .order("applied_at", { ascending: false });

  const applications = (applicationsData as any[]) || [];

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "Selected":
        return <Badge variant="success" className="font-semibold">Selected</Badge>;
      case "Shortlisted":
        return <Badge variant="info" className="font-semibold">Shortlisted</Badge>;
      case "Interview":
        return <Badge variant="info" className="font-semibold bg-purple-500/15 text-purple-700 border-purple-300">Interview Scheduled</Badge>;
      case "Rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "Withdrawn":
        return <Badge variant="outline" className="text-muted-foreground">Withdrawn</Badge>;
      default:
        return <Badge variant="secondary">Applied</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Placement Applications</h1>
          <p className="text-sm text-muted-foreground">
            Track the real-time status and recruitment rounds of your job and internship submissions.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/jobs">Browse Jobs</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/internships">Browse Internships</Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to retrieve application records. Please try again.</span>
        </div>
      )}

      {applications.length === 0 ? (
        <EmptyState
          title="No applications submitted yet"
          description="Explore available campus placement opportunities and submit your profile for eligible listings."
          action={{
            label: "Explore Open Positions",
            onClick: () => {},
          }}
        />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const isJob = app.type === "job";
            const target = isJob ? app.jobs : app.internships;
            const companyName = target?.companies?.name || "Campus Recruiter";
            const compensation = isJob ? target?.salary_package : `${target?.stipend} (${target?.duration})`;
            const appliedDate = new Date(app.applied_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const canWithdraw = app.status !== "Withdrawn" && app.status !== "Rejected" && app.status !== "Selected";

            return (
              <Card key={app.id} className="hover:shadow-sm transition-all border-border/80">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2.5">
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {app.type}
                        </Badge>
                        <h3 className="font-semibold text-base text-foreground">
                          {target?.title || "Position Title"}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center font-medium text-foreground">
                          <Building2 className="h-3.5 w-3.5 mr-1 text-primary" />
                          {companyName}
                        </span>
                        <span>•</span>
                        <span>{compensation}</span>
                        <span>•</span>
                        <span>{target?.work_mode || "On-site"}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Applied on {appliedDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      {getStatusBadge(app.status)}

                      {canWithdraw && (
                        <form
                          action={async () => {
                            "use server";
                            await updateApplicationStatus({
                              applicationId: app.id,
                              newStatus: "Withdrawn",
                            });
                          }}
                        >
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
                          >
                            Withdraw
                          </Button>
                        </form>
                      )}

                      <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                        <Link href={isJob ? `/jobs/${target?.id}` : `/internships/${target?.id}`}>
                          <span>View Listing</span>
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
