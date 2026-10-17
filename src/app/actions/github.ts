"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchGitHubPublicEvidence, type GitHubEvidenceResult } from "@/lib/services/github";

export async function fetchGitHubEvidenceAction(username: string): Promise<{
  success: boolean;
  data?: GitHubEvidenceResult;
  error?: string;
}> {
  return fetchGitHubPublicEvidence(username);
}

export async function saveStudentGitHubEvidenceAction(evidence: GitHubEvidenceResult): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Must be authenticated to save GitHub evidence." };
  }

  const { error } = await supabase
    .from("student_github_evidence")
    .upsert(
      {
        student_id: user.id,
        username: evidence.username,
        public_repos_count: evidence.public_repos_count,
        total_stars: evidence.total_stars,
        languages: evidence.languages as any,
        top_repos: evidence.top_repos as any,
        last_fetched_at: new Date().toISOString(),
      },
      { onConflict: "student_id" }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getStudentGitHubEvidenceAction(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data, error } = await supabase
    .from("student_github_evidence")
    .select("*")
    .eq("student_id", user.id)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
