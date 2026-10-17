import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Users, Briefcase, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  RecruiterApplicationManager,
  type ApplicantRowData,
} from "@/components/placement/recruiter-application-manager";

export default async function RecruiterApplicationsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect("/auth/login?redirect=/recruiter/applications");
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

  // 2. Fetch all jobs and internships for this recruiter
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("recruiter_id", user.id);

  const { data: internships } = await supabase
    .from("internships")
    .select("id, title")
    .eq("recruiter_id", user.id);

  const jobIds = (jobs || []).map((j) => j.id);
  const internshipIds = (internships || []).map((i) => i.id);

  let rawApplications: any[] = [];

  if (jobIds.length > 0 || internshipIds.length > 0) {
    let query = supabase
      .from("applications")
      .select(`
        id,
        student_id,
        job_id,
        internship_id,
        type,
        status,
        applied_at,
        notes,
        profiles:student_id (
          full_name,
          email
        ),
        jobs:job_id (
          title
        ),
        internships:internship_id (
          title
        )
      `)
      .order("applied_at", { ascending: false });

    if (jobIds.length > 0 && internshipIds.length > 0) {
      query = query.or(
        `job_id.in.(${jobIds.join(",")}),internship_id.in.(${internshipIds.join(",")})`
      );
    } else if (jobIds.length > 0) {
      query = query.in("job_id", jobIds);
    } else {
      query = query.in("internship_id", internshipIds);
    }

    const { data: appData } = await query;
    rawApplications = appData || [];
  }

  // 3. Fetch student academic details for applicants
  const studentIds = Array.from(
    new Set(rawApplications.map((a) => a.student_id).filter(Boolean))
  );

  let studentDetailsMap: Record<string, any> = {};
  if (studentIds.length > 0) {
    const { data: details } = await supabase
      .from("student_details")
      .select("user_id, cgpa, skills, course, qualification")
      .in("user_id", studentIds);

    if (details) {
      details.forEach((d) => {
        studentDetailsMap[d.user_id] = d;
      });
    }
  }

  // 4. Format into ApplicantRowData
  const applications: ApplicantRowData[] = rawApplications.map((app) => {
    const studentInfo = app.profiles || {};
    const academicInfo = studentDetailsMap[app.student_id] || {};

    const listingTitle =
      app.jobs?.title || app.internships?.title || "Placement Opportunity";
    const listingId = app.job_id || app.internship_id || "";
    const listingType = app.internship_id ? "internship" : "job";

    return {
      id: app.id,
      studentId: app.student_id,
      studentName: studentInfo.full_name || "Applicant",
      studentEmail: studentInfo.email || "",
      course: academicInfo.course,
      qualification: academicInfo.qualification,
      cgpa: academicInfo.cgpa,
      skills: academicInfo.skills || [],
      listingId,
      listingTitle,
      listingType,
      status: app.status,
      appliedAt: app.applied_at || new Date().toISOString(),
      notes: app.notes,
    };
  });

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs text-primary font-semibold mb-1">
            <Users className="h-4 w-4" />
            <span>Recruiter Candidate Dossiers</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            All Candidate Applications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review student credentials, inspect academic profiles, and manage recruitment pipeline stages.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/recruiter/shortlisted">View Shortlisted Only</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/recruiter/jobs/new">Post Opening</Link>
          </Button>
        </div>
      </div>

      {/* Interactive Application Manager */}
      <RecruiterApplicationManager initialApplications={applications} />
    </div>
  );
}
