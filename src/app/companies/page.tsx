import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Building2,
  MapPin,
  Globe,
  Search,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Users,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import type { Company } from "@/types/database";

interface CompaniesPageProps {
  searchParams: {
    q?: string;
    industry?: string;
  };
}

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const supabase = await createClient();

  let query = supabase.from("companies").select(`
    *,
    jobs:jobs(count),
    internships:internships(count)
  `);

  if (searchParams.industry && searchParams.industry !== "all") {
    query = query.eq("industry", searchParams.industry);
  }

  const { data: companiesData } = await query.order("name", { ascending: true });
  let companies = (companiesData as any[]) || [];

  const searchQuery = (searchParams.q || "").toLowerCase().trim();
  if (searchQuery) {
    companies = companies.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery) ||
        c.industry.toLowerCase().includes(searchQuery) ||
        c.location.toLowerCase().includes(searchQuery)
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="container max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs text-primary font-semibold mb-1">
                <Building2 className="h-4 w-4" />
                <span>Partner Companies</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Recruitment Partners Directory
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Discover verified companies conducting campus recruitment and internship drives.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <form method="GET" className="grid gap-3 sm:grid-cols-3 p-4 rounded-xl bg-card border border-border shadow-sm">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={searchParams.q || ""}
                placeholder="Search by company name, industry, or location..."
                className="pl-9"
              />
            </div>

            <Button type="submit" size="sm" className="h-10 px-4">
              Search Companies
            </Button>
          </form>

          {/* Directory Cards */}
          {companies.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
                <h3 className="font-semibold text-base">No companies match your search</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  Try clearing your search query to view all verified campus recruitment partners.
                </p>
                <Button variant="outline" size="sm" asChild className="mt-4">
                  <Link href="/companies">Clear Search</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => {
                const jobCount = company.jobs?.[0]?.count || 0;
                const internshipCount = company.internships?.[0]?.count || 0;
                const totalListings = jobCount + internshipCount;

                return (
                  <Card key={company.id} className="hover:shadow-md transition-all border-border/80 flex flex-col justify-between">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-bold leading-tight">
                            {company.name}
                          </CardTitle>
                          <span className="text-xs text-muted-foreground font-medium">
                            {company.industry || "Technology"}
                          </span>
                        </div>
                        {company.is_verified && (
                          <Badge variant="success" className="text-[10px] shrink-0 font-medium flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 pt-2 leading-relaxed">
                        {company.description || "Partner company participating in university placements."}
                      </p>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-3">
                        <span className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          {company.location || "Multiple Locations"}
                        </span>
                        <Badge variant="outline" className="text-[11px] font-semibold">
                          {totalListings} Open Drive{totalListings === 1 ? "" : "s"}
                        </Badge>
                      </div>

                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link href={`/companies/${company.id}`} className="flex items-center justify-center">
                          <span>View Company Profile</span>
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
