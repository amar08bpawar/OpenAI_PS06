"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Building2,
  Calendar,
  Code2,
  Award,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { createJobAction, createInternshipAction } from "@/app/actions/listings";
import { JobParserDialog } from "@/components/placement/job-parser-dialog";
import type { JobParserOutput } from "@/lib/services/job-parser";
import type { Company, WorkMode } from "@/types/database";

export default function NewOpportunityPage() {
  const router = useRouter();
  const [opportunityType, setOpportunityType] = useState<"job" | "internship">("job");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [compensation, setCompensation] = useState("");
  const [duration, setDuration] = useState("3 Months");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("On-site");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [minCgpa, setMinCgpa] = useState("7.0");
  const [eligibleQualifications, setEligibleQualifications] = useState("B.Tech, MCA, M.Tech");
  const [eligibleGraduationYears, setEligibleGraduationYears] = useState("2025, 2026");
  const [applicationDeadline, setApplicationDeadline] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [selectionProcess, setSelectionProcess] = useState(
    "1. Online Assessment\n2. Technical Interview\n3. HR Discussion"
  );

  const supabase = createClient();

  useEffect(() => {
    async function loadCompanies() {
      setIsLoadingCompanies(true);
      const { data } = await supabase.from("companies").select("*").order("name");
      if (data && data.length > 0) {
        setCompanies(data as Company[]);
        setCompanyId(data[0].id);
      }
      setIsLoadingCompanies(false);
    }
    loadCompanies();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      setErrorMsg("Please select or create a company first.");
      return;
    }
    if (!title.trim() || !description.trim() || !compensation.trim() || !location.trim()) {
      setErrorMsg("Please fill in all mandatory fields.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const skillsArray = requiredSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const qualArray = eligibleQualifications
      .split(",")
      .map((q) => q.trim())
      .filter(Boolean);

    const yearsArray = eligibleGraduationYears
      .split(",")
      .map((y) => parseInt(y.trim()))
      .filter((y) => !isNaN(y));

    try {
      if (opportunityType === "job") {
        const res = await createJobAction({
          companyId,
          title,
          description,
          salaryPackage: compensation,
          location,
          workMode,
          requiredSkills: skillsArray,
          minCgpa: parseFloat(minCgpa) || 0,
          eligibleQualifications: qualArray,
          eligibleCourses: [],
          eligibleGraduationYears: yearsArray,
          applicationDeadline: new Date(applicationDeadline).toISOString(),
          selectionProcess,
          status: "published",
        });

        if (!res.success) {
          setErrorMsg(res.error || "Failed to create job.");
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createInternshipAction({
          companyId,
          title,
          description,
          stipend: compensation,
          duration,
          location,
          workMode,
          requiredSkills: skillsArray,
          minCgpa: parseFloat(minCgpa) || 0,
          eligibleQualifications: qualArray,
          eligibleCourses: [],
          eligibleGraduationYears: yearsArray,
          applicationDeadline: new Date(applicationDeadline).toISOString(),
          status: "published",
        });

        if (!res.success) {
          setErrorMsg(res.error || "Failed to create internship.");
          setIsSubmitting(false);
          return;
        }
      }

      router.push("/recruiter/jobs");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  const handleApplyParsedData = (data: JobParserOutput) => {
    if (data.title) setTitle(data.title);
    if (data.summary) {
      const resp = data.responsibilities && data.responsibilities.length > 0
        ? `\n\nKey Responsibilities:\n- ${data.responsibilities.join("\n- ")}`
        : "";
      setDescription(`${data.summary}${resp}`);
    }
    if (data.work_mode) setWorkMode(data.work_mode);
    if (data.required_skills && data.required_skills.length > 0) {
      setRequiredSkills(data.required_skills.join(", "));
    }
    if (data.min_cgpa !== null && data.min_cgpa !== undefined) {
      setMinCgpa(data.min_cgpa.toString());
    }
    if (data.eligible_qualifications && data.eligible_qualifications.length > 0) {
      setEligibleQualifications(data.eligible_qualifications.join(", "));
    }
    if (data.eligible_graduation_years && data.eligible_graduation_years.length > 0) {
      setEligibleGraduationYears(data.eligible_graduation_years.join(", "));
    }
    if (data.location) setLocation(data.location);
    if (data.salary_range) setCompensation(data.salary_range);
  };

  return (
    <div className="container max-w-3xl mx-auto py-10 space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/recruiter/jobs" className="flex items-center text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Listings
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Opportunity Posting</h1>
          <p className="text-sm text-muted-foreground">
            Configure job description, salary/stipend, and explicit student eligibility criteria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <JobParserDialog onApply={handleApplyParsedData} />

          {/* Opportunity type switcher */}
          <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setOpportunityType("job")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                opportunityType === "job"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Full-Time Job
            </button>
            <button
              type="button"
              onClick={() => setOpportunityType("internship")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                opportunityType === "internship"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Internship
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="company">Company</Label>
                <Link href="/recruiter/company" className="text-xs text-primary hover:underline">
                  + Add New Company
                </Link>
              </div>
              {isLoadingCompanies ? (
                <p className="text-xs text-muted-foreground">Loading companies...</p>
              ) : companies.length === 0 ? (
                <div className="p-3 rounded-lg border border-dashed text-xs text-muted-foreground text-center">
                  No company records exist yet.{" "}
                  <Link href="/recruiter/company" className="text-primary font-semibold underline">
                    Create your company profile first.
                  </Link>
                </div>
              ) : (
                <select
                  id="company"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.location || "General"})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Position Title</Label>
              <Input
                id="title"
                placeholder={opportunityType === "job" ? "e.g., Graduate Software Engineer" : "e.g., Frontend Engineering Intern"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="compensation">
                  {opportunityType === "job" ? "Salary / Package (LPA)" : "Monthly Stipend"}
                </Label>
                <Input
                  id="compensation"
                  placeholder={opportunityType === "job" ? "e.g., ₹12,00,000 - ₹15,00,000 LPA" : "e.g., ₹30,000 / month"}
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  required
                />
              </div>

              {opportunityType === "internship" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="duration">Internship Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 6 Months"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="workMode">Work Mode</Label>
                  <select
                    id="workMode"
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Bengaluru, Karnataka / Hybrid"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Job / Opportunity Description</Label>
              <textarea
                id="description"
                rows={5}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Detail key responsibilities, role expectations, and tech stack..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Eligibility Criteria Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Award className="h-4 w-4 text-primary" />
              <span>Placement Eligibility Criteria</span>
            </CardTitle>
            <CardDescription>
              Explicit rules checked by the automated student eligibility service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="minCgpa">Minimum CGPA Cutoff (0.0 - 10.0)</Label>
                <Input
                  id="minCgpa"
                  type="number"
                  step="0.1"
                  placeholder="7.0"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gradYears">Eligible Graduation Batches (Comma separated)</Label>
                <Input
                  id="gradYears"
                  placeholder="e.g., 2025, 2026"
                  value={eligibleGraduationYears}
                  onChange={(e) => setEligibleGraduationYears(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qualifications">Eligible Degrees / Qualifications (Comma separated)</Label>
              <Input
                id="qualifications"
                placeholder="e.g., B.Tech, MCA, M.Tech, B.Sc"
                value={eligibleQualifications}
                onChange={(e) => setEligibleQualifications(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="requiredSkills">Mandatory Technical Skills (Comma separated)</Label>
              <Input
                id="requiredSkills"
                placeholder="e.g., React, TypeScript, PostgreSQL, Node.js"
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Candidates missing any mandatory skill are flagged as ineligible.
              </p>
            </div>

            {opportunityType === "job" && (
              <div className="space-y-1.5">
                <Label htmlFor="selectionProcess">Selection & Interview Process</Label>
                <textarea
                  id="selectionProcess"
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectionProcess}
                  onChange={(e) => setSelectionProcess(e.target.value)}
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end pt-4 border-t border-border">
            <Button type="submit" disabled={isSubmitting || companies.length === 0} className="flex items-center space-x-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing Listing...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Publish Opportunity</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
