"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AptitudeClientView } from "./aptitude-client-view";

export default async function AptitudeDashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/auth/login?next=/dashboard/aptitude");
  }

  // Fetch past attempts
  const { data: attempts } = await supabase
    .from("aptitude_attempts")
    .select(`
      id,
      score,
      total_questions,
      correct_count,
      time_spent_seconds,
      passed,
      created_at,
      test:test_id (
        id,
        title,
        category,
        difficulty
      )
    `)
    .eq("student_id", authData.user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Placement Aptitude & Technical Exams</h1>
        <p className="text-muted-foreground text-sm">
          Master company placement screening tests with timed assessments, deterministic scoring, and detailed step-by-step explanations.
        </p>
      </div>

      <AptitudeClientView initialAttempts={(attempts as any) || []} />
    </div>
  );
}
