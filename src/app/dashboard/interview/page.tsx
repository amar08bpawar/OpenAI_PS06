"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InterviewClientView } from "./interview-client-view";

export default async function InterviewDashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/auth/login?next=/dashboard/interview");
  }

  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("student_id", authData.user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Interview Simulator & Coach</h1>
        <p className="text-muted-foreground text-sm">
          Practice realistic placement interview rounds (HR, Technical, Communication, Teamwork) with immediate actionable feedback.
        </p>
      </div>

      <InterviewClientView initialSessions={(sessions as any) || []} />
    </div>
  );
}
