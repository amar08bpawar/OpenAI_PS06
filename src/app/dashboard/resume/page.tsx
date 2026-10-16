import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResumeClientView } from "./resume-client-view";
import {
  getStudentResumesAction,
  importAcademicProfileResumeAction,
} from "@/app/actions/resume";
import { defaultResumeData } from "@/types/resume";

export const metadata: Metadata = {
  title: "AI Resume Builder & Printable Templates | Placement Hub",
  description:
    "Build, format, customize, and export professional campus placement resumes with live preview and AI-assisted rewriting.",
};

export default async function ResumeBuilderPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    redirect("/auth/login?redirect=/dashboard/resume");
  }

  // Load existing resumes or default to profile prefill
  const [resumesRes, profileRes] = await Promise.all([
    getStudentResumesAction(),
    importAcademicProfileResumeAction(),
  ]);

  const existingResumes = resumesRes.data || [];
  const latestResume = existingResumes.length > 0 ? existingResumes[0] : null;
  const profileData = profileRes.data || defaultResumeData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Interactive Resume Builder
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Craft ATS-optimized, recruiter-approved resumes with live printable templates, instant PDF export, and verified profile data.
        </p>
      </div>

      <ResumeClientView
        initialResume={latestResume}
        profileResumeData={profileData}
      />
    </div>
  );
}
