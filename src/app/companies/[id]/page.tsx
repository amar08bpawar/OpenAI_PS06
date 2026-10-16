import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Phone,
  Briefcase,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

interface CompanyDetailPageProps {
  params: {
    id: string;
  };
}

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const supabase = await createClient();

  const { data: companyData, error } = await supabase
    .from("companies")
    .select(`
      *,
      jobs:jobs(*),
      internships:internships(*)
    `)
    .eq("id", params.id)
    .single();

  if (error || !companyData) {
    notFound();
  }

  const company = companyData as any;
  const jobs = company.jobs?.filter((j: any) => j.status === "published") || [];
  const internships = company.internships?.filter((i: any) => i.status === "published") || [];

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="container max-w-5xl mx-auto space-y-8">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/companies" className="flex items-center text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to Companies Directory
            </Link>
          </Button>

          {/* Company Hero Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                    {company.name}
                  </h1>
                  {company.is_verified && (
                    <Badge variant="success" className="text-xs">
                      Verified Partner
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-primary font-medium">{company.industry || "Technology & Services"}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                  {company.location || "Multiple Locations"}
                </span>
                {company.website && (
                  <span className="flex items-center">
                    <Globe className="h-4 w-4 mr-1 text-muted-foreground" />
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      Website
                    </a>
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/60">
              {company.description || "Leading recruitment partner participating in campus placement."}
            </p>

            {(company.contact_email || company.contact_phone) && (
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-muted-foreground">
                {company.contact_email && (
                  <div className="flex items-center space-x-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{company.contact_email}</span>
                  </div>
                )}
                {company.contact_phone && (
                  <div className="flex items-center space-x-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{company.contact_phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Active Jobs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <span>Full-Time Placement Drives ({jobs.length})</span>
              </h2>
            </div>

            {jobs.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-xs text-muted-foreground">
                  No active full-time placement drives at this time.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {jobs.map((job: any) => (
                  <Card key={job.id} className="hover:shadow-sm border-border/80">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-semibold">{job.title}</CardTitle>
                        <Badge variant="outline" className="text-[10px]">{job.work_mode}</Badge>
                      </div>
                      <p className="text-xs font-semibold text-foreground pt-1">{job.salary_package}</p>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border/60">
                        <span>Min CGPA: {job.min_cgpa > 0 ? job.min_cgpa.toFixed(1) : "Any"}</span>
                        <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary">
                          <Link href={`/jobs/${job.id}`}>View & Apply</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Active Internships Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Internship Opportunities ({internships.length})</span>
              </h2>
            </div>

            {internships.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-xs text-muted-foreground">
                  No active internship opportunities at this time.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {internships.map((internship: any) => (
                  <Card key={internship.id} className="hover:shadow-sm border-border/80">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-semibold">{internship.title}</CardTitle>
                        <Badge variant="outline" className="text-[10px]">{internship.work_mode}</Badge>
                      </div>
                      <p className="text-xs font-semibold text-foreground pt-1">
                        {internship.stipend} • {internship.duration}
                      </p>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border/60">
                        <span>Min CGPA: {internship.min_cgpa > 0 ? internship.min_cgpa.toFixed(1) : "Any"}</span>
                        <Button variant="link" size="sm" asChild className="p-0 h-auto text-primary">
                          <Link href={`/internships/${internship.id}`}>View & Apply</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
