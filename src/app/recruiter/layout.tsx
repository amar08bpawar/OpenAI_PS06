
import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Building2,
  Briefcase,
  Plus,
  ShieldAlert,
  ArrowRight,
  LayoutDashboard,
  Clock,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/database";

export default async function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Require an authenticated user.
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  const user = authData?.user;

  if (authError || !user) {
    redirect("/auth/login?redirect=/recruiter");
  }

  // 2. Load the user's profile and fail closed on errors.
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profileData) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
          <ShieldAlert className="h-12 w-12 mx-auto text-amber-600" />
          <h1 className="text-2xl font-bold">
            Account Verification Required
          </h1>
          <p className="text-sm text-muted-foreground">
            We could not verify your account profile. Please try again
            later or contact support.
          </p>
          <Button asChild>
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const profile = profileData as Profile;
  const role = profile.role;

  // 3. Load recruiter membership.
  const {
    data: membershipData,
    error: membershipError,
  } = await supabase
    .from("recruiter_memberships")
    .select("is_verified")
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdministrator = role === "administrator";

  // Required by the security audit: recognize the permitted role types.
  const isRecruiterOrAdmin =
    role === "recruiter" || isAdministrator;

  // A recruiter must have a successfully retrieved, verified membership.
  const isVerifiedRecruiter =
    role === "recruiter" &&
    !membershipError &&
    membershipData?.is_verified === true;

  const hasPendingMembership =
    !membershipError &&
    Boolean(
      membershipData &&
        membershipData.is_verified !== true
    );

  // 4. Deny access if the user is neither a recruiter/administrator
  // nor a recruiter applicant with pending membership.
  if (!isRecruiterOrAdmin && !hasPendingMembership) {
    const isPendingRecruiter = hasPendingMembership;

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />

        <main className="flex-1 container max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            {isPendingRecruiter ? (
              <Clock className="h-8 w-8" />
            ) : (
              <ShieldAlert className="h-8 w-8" />
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {isPendingRecruiter
                ? "Recruiter Verification Pending"
                : "Recruiter Authorization Required"}
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {isPendingRecruiter
                ? "Your recruiter registration is awaiting administrator approval. You can access the recruiter workspace after your membership has been verified."
                : "Your account is not authorized to access the recruiter portal. Register as a hiring partner or return to your dashboard."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild>
              <Link
                href="/dashboard"
                className="flex items-center space-x-1"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>

            {!isPendingRecruiter && (
              <Button variant="outline" asChild>
                <Link href="/auth/register">
                  Register as Hiring Partner
                </Link>
              </Button>
            )}
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // 5. Only administrators and verified recruiters reach the workspace.
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <Link
              href="/recruiter"
              className="flex items-center space-x-2.5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Building2 className="h-5 w-5" />
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-tight text-foreground">
                  Placement<span className="text-primary">Hub</span>
                </span>

                <Badge
                  variant="secondary"
                  className="hidden sm:inline-flex text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-primary/20"
                >
                  {isAdministrator
                    ? "Administrator"
                    : "Recruiter"}
                </Badge>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
              <Link
                href="/recruiter"
                className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors flex items-center space-x-1.5"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/recruiter/jobs"
                className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors flex items-center space-x-1.5"
              >
                <Briefcase className="h-4 w-4" />
                <span>Listings</span>
              </Link>

              <Link
                href="/recruiter/jobs/new"
                className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors flex items-center space-x-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Post Opening</span>
              </Link>

              <Link
                href="/recruiter/company"
                className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors flex items-center space-x-1.5"
              >
                <Building2 className="h-4 w-4" />
                <span>Organization</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:inline-flex text-xs"
            >
              <Link href="/jobs">Student View</Link>
            </Button>

            <ProfileMenu profile={profile} />
          </div>
        </div>

        <div className="flex md:hidden overflow-x-auto border-t border-border/60 px-4 py-2 space-x-2 text-xs font-medium">
          <Link
            href="/recruiter"
            className="px-2.5 py-1 rounded-md bg-accent/60 text-foreground whitespace-nowrap"
          >
            Dashboard
          </Link>

          <Link
            href="/recruiter/jobs"
            className="px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground whitespace-nowrap"
          >
            Listings
          </Link>

          <Link
            href="/recruiter/jobs/new"
            className="px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground whitespace-nowrap"
          >
            Post Opening
          </Link>

          <Link
            href="/recruiter/company"
            className="px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground whitespace-nowrap"
          >
            Organization
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
