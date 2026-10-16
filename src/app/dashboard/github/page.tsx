"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GitHubClientView } from "./github-client-view";

export default async function GitHubEvidencePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/auth/login?next=/dashboard/github");
  }

  // Fetch student profile details to check if they have a GitHub username already recorded
  const { data: details } = await supabase
    .from("student_details")
    .select("phone, linkedin_url")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  // Fetch saved evidence if exists
  const { data: savedEvidence } = await supabase
    .from("student_github_evidence")
    .select("*")
    .eq("student_id", authData.user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">GitHub Public Skill Evidence</h1>
        <p className="text-muted-foreground text-sm">
          Extract objective technical signals and language distributions from public GitHub repositories.
        </p>
      </div>

      <GitHubClientView savedEvidence={savedEvidence} />
    </div>
  );
}
