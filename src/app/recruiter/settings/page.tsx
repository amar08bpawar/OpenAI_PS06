import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Settings,
  Building2,
  User,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function RecruiterSettingsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect("/auth/login?redirect=/recruiter/settings");
  }

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "recruiter" && profile?.role !== "administrator") {
    redirect("/dashboard");
  }

  // 2. Fetch recruiter membership
  const { data: membership } = await supabase
    .from("recruiter_memberships")
    .select("*, companies:company_id(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  const isVerified =
    profile.role === "administrator" || membership?.is_verified === true;

  const companyName =
    membership?.company_name ||
    membership?.companies?.name ||
    (user.user_metadata?.company_name as string) ||
    "Hiring Organization";

  const designation =
    membership?.designation ||
    (user.user_metadata?.designation as string) ||
    "Campus Talent Partner";

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 text-xs text-primary font-semibold mb-1">
          <Settings className="h-4 w-4" />
          <span>Account Preferences</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Recruiter Settings & Organization Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your authorized campus credentials, institutional verification status, and corporate profile.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Verification Status Card */}
        <Card className={isVerified ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}>
          <CardContent className="p-5 flex items-start space-x-4">
            {isVerified ? (
              <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            )}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm text-foreground">
                  {isVerified ? "Verified Recruiter Organization" : "Institutional Verification Pending"}
                </h3>
                {isVerified ? (
                  <Badge variant="success" className="text-[10px]">Active</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 bg-amber-500/10">Pending Approval</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isVerified
                  ? "Your organization is verified by university placement administrators. Your job postings and campus drives are eligible for immediate publication."
                  : "Your recruiter account is awaiting institutional approval. An administrator verifies corporate credentials before listings are displayed to students."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <User className="h-4 w-4 text-primary" />
              <span>Personal Account Information</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Credentials registered with the placement system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground block font-medium">Full Name</span>
                <span className="text-foreground text-sm font-semibold">{profile.full_name || "Recruiter"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">Email Address</span>
                <span className="text-foreground text-sm font-semibold">{user.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">System Role</span>
                <span className="text-foreground text-sm font-semibold capitalize">{profile.role}</span>
              </div>
              <div>
                <span className="text-muted-foreground block font-medium">Corporate Designation</span>
                <span className="text-foreground text-sm font-semibold">{designation}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span>Associated Hiring Organization</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Company profile attached to your recruitment drives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground block font-medium">Organization Name</span>
                <span className="text-foreground text-sm font-semibold">{companyName}</span>
              </div>
              {membership?.companies?.industry && (
                <div>
                  <span className="text-muted-foreground block font-medium">Industry</span>
                  <span className="text-foreground text-sm font-semibold">{membership.companies.industry}</span>
                </div>
              )}
              {membership?.companies?.location && (
                <div>
                  <span className="text-muted-foreground block font-medium">Headquarters</span>
                  <span className="text-foreground text-sm font-semibold">{membership.companies.location}</span>
                </div>
              )}
              {membership?.companies?.website && (
                <div>
                  <span className="text-muted-foreground block font-medium">Website</span>
                  <a
                    href={membership.companies.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm font-semibold inline-flex items-center"
                  >
                    <span>{membership.companies.website.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/60 py-3 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Need to update company details or logo?</span>
            <Button size="sm" variant="outline" asChild className="text-xs">
              <Link href="/recruiter/company">Edit Organization Profile</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
