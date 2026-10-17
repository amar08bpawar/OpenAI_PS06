"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SavedCourseStatus, StudentSavedCourse } from "@/types/database";

export interface SaveCourseInput {
  course_id: string;
  provider?: string;
  title: string;
  partner_name?: string | null;
  course_url: string;
  image_url?: string | null;
  category?: string | null;
  difficulty?: string | null;
  skills?: string[];
  status?: SavedCourseStatus;
}

/**
 * Saves a course to the student's personal skill development tracker.
 */
export async function saveCourseAction(input: SaveCourseInput) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "You must be signed in to save courses." };
  }

  // Verify student profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "recruiter") {
    return { success: false, error: "Recruiter accounts cannot enroll in student skill courses." };
  }

  const provider = input.provider || "coursera";
  const status: SavedCourseStatus = input.status || "Saved";

  const payload = {
    student_id: user.id,
    course_id: input.course_id,
    provider,
    title: input.title,
    partner_name: input.partner_name || null,
    course_url: input.course_url,
    image_url: input.image_url || null,
    category: input.category || null,
    difficulty: input.difficulty || null,
    skills: input.skills || [],
    status,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("student_saved_courses")
    .upsert(payload, { onConflict: "student_id,provider,course_id" })
    .select()
    .single();

  if (error) {
    console.error("Error saving course:", error);
    return { success: false, error: "Failed to save course. Please try again." };
  }

  revalidatePath("/dashboard/skills");
  revalidatePath("/dashboard");

  return { success: true, savedCourse: data as StudentSavedCourse };
}

/**
 * Removes a course from the student's saved list.
 */
export async function removeSavedCourseAction(courseId: string, provider: string = "coursera") {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "You must be signed in to manage courses." };
  }

  const { error } = await supabase
    .from("student_saved_courses")
    .delete()
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .eq("provider", provider);

  if (error) {
    console.error("Error removing course:", error);
    return { success: false, error: "Failed to remove course from saved list." };
  }

  revalidatePath("/dashboard/skills");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Updates learning status (Saved -> In Progress -> Completed)
 */
export async function updateSavedCourseStatusAction(
  courseId: string,
  status: SavedCourseStatus,
  provider: string = "coursera"
) {
  const validStatuses: SavedCourseStatus[] = ["Saved", "In Progress", "Completed"];
  if (!validStatuses.includes(status)) {
    return { success: false, error: `Invalid status value: ${status}` };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "You must be signed in to update course status." };
  }

  const { data, error } = await supabase
    .from("student_saved_courses")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .eq("provider", provider)
    .select()
    .single();

  if (error) {
    console.error("Error updating course status:", error);
    return { success: false, error: "Failed to update course progress." };
  }

  revalidatePath("/dashboard/skills");
  revalidatePath("/dashboard");

  return { success: true, updatedCourse: data as StudentSavedCourse };
}

/**
 * Retrieves all saved courses for the authenticated student.
 */
export async function getSavedCoursesAction(): Promise<{
  success: boolean;
  courses: StudentSavedCourse[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, courses: [], error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("student_saved_courses")
    .select("*")
    .eq("student_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching saved courses:", error);
    return { success: false, courses: [], error: error.message };
  }

  return { success: true, courses: (data as StudentSavedCourse[]) || [] };
}
