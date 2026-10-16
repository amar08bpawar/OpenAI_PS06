"use server";

import { parseJobDescription, type JobParserOutput } from "@/lib/services/job-parser";
import { createClient } from "@/lib/supabase/server";

export async function parseJobDescriptionAction(rawText: string): Promise<{
  success: boolean;
  data?: JobParserOutput;
  error?: string;
  isFallback?: boolean;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    return { success: false, error: "Authentication required to parse job descriptions." };
  }

  return parseJobDescription(rawText);
}
