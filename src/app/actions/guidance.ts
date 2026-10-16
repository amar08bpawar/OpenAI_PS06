"use server";

import { createClient } from "@/lib/supabase/server";
import { generateCareerGuidance } from "@/lib/services/career-guidance";
import type { CareerGuidanceAnalysis } from "@/types/database";

export async function generateCareerGuidanceAction(targetRole: string): Promise<{
  success: boolean;
  data?: CareerGuidanceAnalysis;
  error?: string;
  isFallback?: boolean;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required to generate career guidance." };
  }

  // 1. Fetch student profile and detailed records
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: details } = await supabase
    .from("student_details")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // 2. Generate guidance
  const guidanceResult = await generateCareerGuidance({
    studentProfile: profile,
    studentDetails: details,
    targetRole: targetRole || "Software Engineer",
  });

  if (!guidanceResult.success || !guidanceResult.data) {
    return { success: false, error: guidanceResult.error || "Failed to generate career guidance." };
  }

  // 3. Persist guidance report in database
  await supabase.from("career_guidance_reports").insert({
    student_id: user.id,
    target_role: targetRole || "Software Engineer",
    analysis: guidanceResult.data as any,
  });

  return {
    success: true,
    data: guidanceResult.data,
    isFallback: guidanceResult.isFallback,
  };
}

export async function getLatestCareerGuidanceAction(): Promise<{
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
    .from("career_guidance_reports")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
