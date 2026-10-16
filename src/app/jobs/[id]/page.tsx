import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  Clock,
  Award,
  GraduationCap,
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  CheckCircle2,
  ListOrdered,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EligibilityCard } from "@/components/placement/eligibility-card";
import { ApplyButton } from "@/components/placement/apply-button";
import { checkEligibility } from "@/lib/services/eligibility";
import type { Job, StudentDetails, ApplicationStatus } from "@/types/database";

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  // 1. Fetch job with company
  const { data: jobData, error } = await supabase
    .from("jobs")
    .select(`
      *,
      companies:company_id (
        id,
        name,
        logo_url,
        description,
        location,
        industry,
        website,
        contact_email,
        contact_phone
      )
    `)
    .eq("id", params.id)
    .single();

  if (error || !jobData) {
    notFound();
  }

  const job = jobData as any;
  const company = job.companies;

  // 2. Fetch student details and existing application if user logged in
  let studentDetails: StudentDetails | null = null;
  let userRole = "student";
  let existingApplication: { id: string; status: ApplicationStatus } | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile) userRole = profile.role;

    const { data: sData } = await supabase
      .from("student_details")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    studentDetails = sData as StudentDetails | null;

    const { data: appData } = await supabase
      .from("applications")
      .select("id, status")
      .eq("student_id", user.id)
      .eq("job_id", job.id)
      .maybeSingle();

    if (appData) {
      existingApplication = {
        id: appData.id,
        status: appData.status as ApplicationStatus,
      };
    }
  }

  const eligibility = checkEligibility(job, studentDetails);
  const deadlineStr = new Date(job.application_deadline).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="container max-w-5xl mx-auto space-y-8">
          {/* Back button */}
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/jobs" className="flex items-center text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to Job Listings
            </Link>
          </Button>

          {/* Job Header Hero */}
          <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary">
                  {company?.name || "Campus Recruiter"}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {job.work_mode}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Full-Time Placement
                </Badge>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                <span className="font-bold text-foreground text-base">
                  {job.salary_package}
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                  {job.location}
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  Apply before {deadlineStr}
                </span>
              </div>
            </div>

            {/* Apply Action CTA */}
            <div className="shrink-0 w-full sm:w-auto flex flex-col items-start sm:items-end">
              {user ? (
                <ApplyButton
                  targetId={job.id}
                  type="job"
                  title={job.title}
                  companyName={company?.name || "Recruiter"}
                  existingApplication={existingApplication}
                  eligibility={eligibility}
                  userRole={userRole}
                />
              ) : (
                <Button size="lg" asChild>
                  <Link href={`/auth/login?redirect=/jobs/${job.id}`}>
                    Sign in to Check Eligibility & Apply
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Eligibility Card Banner */}
          {user && (
            <div>
              <h2 className="text-base font-bold mb-2">Automated Eligibility Evaluation</h2>
              <EligibilityCard eligibility={eligibility} showBreakdownInitially={true} />
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left 2 Cols: Details & Selection Process */}
            <div className="md:col-span-2 space-y-6">
              {/* Job Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Role Overview & Responsibilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {job.description}
                </CardContent>
              </Card>

              {/* Required Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Required Technical Skills</CardTitle>
                  <CardDescription>
                    Explicit technical prerequisites checked by the eligibility engine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills?.map((skill: string, idx: number) => {
                      const hasSkill = studentDetails?.skills?.some(
                        (s) => s.toLowerCase().trim() === skill.toLowerCase().trim()
                      );

                      return (
                        <Badge
                          key={idx}
                          variant={hasSkill ? "success" : "secondary"}
                          className="text-xs py-1 px-3 flex items-center space-x-1"
                        >
                          {hasSkill && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          <span>{skill}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Selection Process */}
              {job.selection_process && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <ListOrdered className="h-5 w-5 text-primary" />
                      <span>Placement Selection Process</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {job.selection_process}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Col: Eligibility Criteria Summary & Company Card */}
            <div className="space-y-6">
              {/* Requirements Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Placement Criteria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Minimum CGPA:</span>
                    <span className="font-semibold text-foreground">
                      {job.min_cgpa > 0 ? `${job.min_cgpa.toFixed(1)} / 10.0` : "No Min CGPA"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Eligible Degrees:</span>
                    <span className="font-semibold text-foreground text-right max-w-[150px]">
                      {job.eligible_qualifications?.length > 0
                        ? job.eligible_qualifications.join(", ")
                        : "All Qualifications"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Eligible Batches:</span>
                    <span className="font-semibold text-foreground">
                      {job.eligible_graduation_years?.length > 0
                        ? job.eligible_graduation_years.join(", ")
                        : "All Batches"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">Work Mode:</span>
                    <span className="font-semibold text-foreground">{job.work_mode}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span>About {company?.name}</span>
                  </CardTitle>
                  <CardDescription>{company?.industry || "Technology & Services"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                  <p>{company?.description || "Leading recruitment partner participating in campus placement."}</p>

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{company?.location || "Headquarters"}</span>
                    </div>

                    {company?.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline truncate"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
