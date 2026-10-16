"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GuidanceClientView } from "./guidance-client-view";

export default async function CareerGuidancePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/auth/login?next=/dashboard/guidance");
  }

  // Fetch student profile & details
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  const { data: details } = await supabase
    .from("student_details")
    .select("*")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  // Fetch latest saved report if any
  const { data: latestReport } = await supabase
    .from("career_guidance_reports")
    .select("*")
    .eq("student_id", authData.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Career Guidance & Skill-Gap Analysis</h1>
        <p className="text-muted-foreground text-sm">
          Personalized placement preparation roadmaps and skill-gap diagnostics based on your recorded profile and target industry role.
        </p>
      </div>

      <GuidanceClientView
        profile={profile}
        details={details}
        savedReport={latestReport}
      />
    </div>
  );
}
