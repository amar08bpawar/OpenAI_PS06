import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  searchCourseraCourses,
  getRecommendedCoursesForStudent,
  getCourseraConfigStatus,
} from "@/lib/services/coursera";
import { SkillsHubClient } from "@/components/dashboard/skills-hub-client";
import type { StudentDetails, StudentSavedCourse } from "@/types/database";

export const metadata = {
  title: "Skill Development Hub & Coursera Certifications — Placement Hub",
  description:
    "Explore university-backed and industry-recognized courses from Coursera, track skill progress, and bridge recruitment preparation gaps.",
};

export default async function SkillsHubPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    redirect("/auth/login?redirect=/dashboard/skills");
  }

  // Verify profile & role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "recruiter") {
    redirect("/recruiter");
  }

  // Fetch student details for skills and recommendation tailoring
  const { data: studentDetails } = await supabase
    .from("student_details")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const details = studentDetails as StudentDetails | null;
  const studentSkills = details?.skills || [];
  const courseOrMajor = details?.course || "";

  // Fetch initial saved courses
  const { data: savedData } = await supabase
    .from("student_saved_courses")
    .select("*")
    .eq("student_id", user.id)
    .order("updated_at", { ascending: false });

  const savedCourses = (savedData as StudentSavedCourse[]) || [];

  // Fetch Coursera catalog & config status
  const catalogResponse = await searchCourseraCourses({ limit: 50 });
  const configStatus = getCourseraConfigStatus();
  const recommendedCourses = getRecommendedCoursesForStudent(studentSkills, courseOrMajor);

  return (
    <div className="space-y-6">
      <SkillsHubClient
        initialCourses={catalogResponse.courses}
        recommendedCourses={recommendedCourses}
        initialSavedCourses={savedCourses}
        configStatus={configStatus}
        studentSkills={studentSkills}
      />
    </div>
  );
}
