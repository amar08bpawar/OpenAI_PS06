import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Sparkles,
  Building2,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EligibilityCard } from "@/components/placement/eligibility-card";
import { ApplyButton } from "@/components/placement/apply-button";
import { checkEligibility } from "@/lib/services/eligibility";
import type { Internship, StudentDetails, ApplicationStatus } from "@/types/database";

interface InternshipDetailPageProps {
  params: {
    id: string;
  };
}

export default async function InternshipDetailPage({ params }: InternshipDetailPageProps) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  const { data: internshipData, error } = await supabase
    .from("internships")
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

  if (error || !internshipData) {
    notFound();
  }

  const internship = internshipData as any;
  const company = internship.companies;

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
      .eq("internship_id", internship.id)
      .maybeSingle();

    if (appData) {
      existingApplication = {
        id: appData.id,
        status: appData.status as ApplicationStatus,
      };
    }
  }

  const eligibility = checkEligibility(internship, studentDetails);
  const deadlineStr = new Date(internship.application_deadline).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="container max-w-5xl mx-auto space-y-8">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/internships" className="flex items-center text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to Internship Listings
            </Link>
          </Button>

          {/* Header Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary">
                  {company?.name || "Campus Recruiter"}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {internship.work_mode}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Internship ({internship.duration})
                </Badge>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                {internship.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
                <span className="font-bold text-foreground text-base">
                  Stipend: {internship.stipend}
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                  {internship.location}
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  Apply before {deadlineStr}
                </span>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto flex flex-col items-start sm:items-end">
              {user ? (
                <ApplyButton
                  targetId={internship.id}
                  type="internship"
                  title={internship.title}
                  companyName={company?.name || "Recruiter"}
                  existingApplication={existingApplication}
                  eligibility={eligibility}
                  userRole={userRole}
                />
              ) : (
                <Button size="lg" asChild>
                  <Link href={`/auth/login?redirect=/internships/${internship.id}`}>
                    Sign in to Check Eligibility & Apply
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Eligibility Card */}
          {user && (
            <div>
              <h2 className="text-base font-bold mb-2">Automated Eligibility Evaluation</h2>
              <EligibilityCard eligibility={eligibility} showBreakdownInitially={true} />
            </div>
          )}

          {/* Main Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Internship Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {internship.description}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prerequisite Technical Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {internship.required_skills?.map((skill: string, idx: number) => {
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
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Internship Criteria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Stipend:</span>
                    <span className="font-semibold text-foreground">{internship.stipend}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-semibold text-foreground">{internship.duration}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground">Min CGPA:</span>
                    <span className="font-semibold text-foreground">
                      {internship.min_cgpa > 0 ? `${internship.min_cgpa.toFixed(1)} / 10.0` : "No Min CGPA"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">Work Mode:</span>
                    <span className="font-semibold text-foreground">{internship.work_mode}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span>About {company?.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                  <p>{company?.description || "Partner recruitment organization."}</p>
                  <div className="pt-2 border-t border-border/60 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{company?.location || "Headquarters"}</span>
                    </div>
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
