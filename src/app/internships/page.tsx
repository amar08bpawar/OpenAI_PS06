import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Sparkles,
  Building2,
  MapPin,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { checkEligibility } from "@/lib/services/eligibility";
import type { Internship, StudentDetails } from "@/types/database";

interface InternshipsPageProps {
  searchParams: {
    q?: string;
    mode?: string;
    sort?: string;
  };
}

export default async function InternshipsPage({ searchParams }: InternshipsPageProps) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  let studentDetails: StudentDetails | null = null;
  let existingApplicationsMap: Record<string, string> = {};

  if (user) {
    const { data: sData } = await supabase
      .from("student_details")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    studentDetails = sData as StudentDetails | null;

    const { data: apps } = await supabase
      .from("applications")
      .select("internship_id, status")
      .eq("student_id", user.id)
      .not("internship_id", "is", null);

    if (apps) {
      apps.forEach((a) => {
        if (a.internship_id) existingApplicationsMap[a.internship_id] = a.status;
      });
    }
  }

  let query = supabase
    .from("internships")
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

  const { data: internshipsData } = await query.order("created_at", { ascending: false });
  let internships = (internshipsData as any[]) || [];

  const searchQuery = (searchParams.q || "").toLowerCase().trim();
  if (searchQuery) {
    internships = internships.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(searchQuery);
      const companyMatch = item.companies?.name?.toLowerCase().includes(searchQuery);
      const skillMatch = item.required_skills?.some((s: string) =>
        s.toLowerCase().includes(searchQuery)
      );
      return titleMatch || companyMatch || skillMatch;
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="container max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs text-primary font-semibold mb-1">
                <Sparkles className="h-4 w-4" />
                <span>Internship Opportunities</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Campus Internships
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Explore paid summer and semester internships with top campus recruiters.
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

          {/* Search bar */}
          <form method="GET" className="grid gap-3 sm:grid-cols-4 p-4 rounded-xl bg-card border border-border shadow-sm">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={searchParams.q || ""}
                placeholder="Search internship title, company, or required skill..."
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

            <Button type="submit" size="sm" className="h-10 px-4">
              Filter Listings
            </Button>
          </form>

          {/* Results list */}
          {internships.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
                <h3 className="font-semibold text-base">No matching internships found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  Try broadening your search query or reset filters.
                </p>
                <Button variant="outline" size="sm" asChild className="mt-4">
                  <Link href="/internships">Reset Filters</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {internships.map((internship) => {
                const companyName = internship.companies?.name || "Campus Recruiter";
                const eligibility = user ? checkEligibility(internship, studentDetails) : null;
                const existingStatus = existingApplicationsMap[internship.id];
                const deadline = new Date(internship.application_deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <Card key={internship.id} className="hover:shadow-md transition-all border-border/80 flex flex-col justify-between">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-primary flex items-center">
                            <Building2 className="h-3.5 w-3.5 mr-1" />
                            {companyName}
                          </span>
                          <CardTitle className="text-lg font-bold leading-tight line-clamp-1">
                            {internship.title}
                          </CardTitle>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                          {internship.work_mode}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{internship.stipend}</span>
                        <span>•</span>
                        <span>{internship.duration}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-0.5" />
                          {internship.location}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-4">
                      {internship.required_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {internship.required_skills.slice(0, 3).map((skill: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-2 font-normal">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="text-[11px] text-muted-foreground space-y-1 border-t border-border/60 pt-2.5">
                        <div className="flex justify-between">
                          <span>Min CGPA:</span>
                          <span className="font-medium text-foreground">
                            {internship.min_cgpa > 0 ? `${internship.min_cgpa.toFixed(1)}+` : "Any"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Deadline:</span>
                          <span className="font-medium text-foreground">{deadline}</span>
                        </div>
                      </div>

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
                        <Link href={`/internships/${internship.id}`} className="flex items-center justify-center">
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
