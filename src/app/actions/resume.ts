"use server";

import { createClient } from "@/lib/supabase/server";
import {
  ResumeDataSchema,
  type ResumeData,
  type ResumeTemplateId,
  type ResumeRecord,
  defaultResumeData,
} from "@/types/resume";
import {
  rewriteResumeContent,
  type AIRewriteOutput,
} from "@/lib/services/resume";

const VALID_TEMPLATES: ResumeTemplateId[] = ["modern", "classic", "minimal"];

/**
 * Saves or updates a student's resume draft in Supabase.
 * Enforces authenticated session and user ownership.
 */
export async function saveResumeDraftAction(params: {
  id?: string;
  title: string;
  template_id: ResumeTemplateId;
  data: ResumeData;
  is_primary?: boolean;
}): Promise<{
  success: boolean;
  data?: { id: string; updatedAt: string };
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required to save resume." };
  }

  const cleanTitle = (params.title || "").trim() || "My Placement Resume";
  const templateId = VALID_TEMPLATES.includes(params.template_id)
    ? params.template_id
    : "modern";

  // Validate resume structure with Zod
  const validation = ResumeDataSchema.safeParse(params.data);
  if (!validation.success) {
    const errorMsg = validation.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    return { success: false, error: `Invalid resume data: ${errorMsg}` };
  }

  const validatedData = validation.data;

  try {
    if (params.id) {
      // Update existing resume ensuring ownership
      const { data: updated, error: updateError } = await supabase
        .from("resumes")
        .update({
          title: cleanTitle,
          template_id: templateId,
          data: validatedData as any,
          is_primary: Boolean(params.is_primary),
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
        .eq("student_id", user.id)
        .select()
        .single();

      if (updateError || !updated) {
        return { success: false, error: updateError?.message || "Failed to update resume." };
      }

      return {
        success: true,
        data: { id: updated.id, updatedAt: updated.updated_at },
      };
    } else {
      // Insert new resume record
      const { data: inserted, error: insertError } = await supabase
        .from("resumes")
        .insert({
          student_id: user.id,
          title: cleanTitle,
          template_id: templateId,
          data: validatedData as any,
          is_primary: Boolean(params.is_primary),
        })
        .select()
        .single();

      if (insertError || !inserted) {
        return { success: false, error: insertError?.message || "Failed to create resume." };
      }

      return {
        success: true,
        data: { id: inserted.id, updatedAt: inserted.updated_at },
      };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || "Database operation failed." };
  }
}

/**
 * Retrieves all saved resumes belonging to the authenticated student.
 */
export async function getStudentResumesAction(): Promise<{
  success: boolean;
  data?: ResumeRecord[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("student_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data as any) || [] };
}

/**
 * Deletes a specific resume belonging to the authenticated student.
 */
export async function deleteResumeAction(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { error } = await supabase
    .from("resumes")
    .delete()
    .eq("id", id)
    .eq("student_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Pre-populates resume data from verified student profile & academic details.
 */
export async function importAcademicProfileResumeAction(): Promise<{
  success: boolean;
  data?: ResumeData;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

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

  const resumeData: ResumeData = {
    ...defaultResumeData,
    contact: {
      fullName: profile?.full_name || "",
      email: profile?.email || user.email || "",
      phone: details?.phone || "",
      location: details?.college ? `${details.college}` : "",
      linkedinUrl: details?.linkedin_url || "",
      githubUrl: details?.github_username
        ? `https://github.com/${details.github_username}`
        : "",
      portfolioUrl: "",
    },
    education: details?.college || details?.course
      ? [
          {
            id: "edu-1",
            institution: details.college || "University Institute of Technology",
            degree: details.qualification ? `${details.qualification} - ${details.course}` : details.course || "B.Tech",
            fieldOfStudy: details.branch || "Computer Science",
            startDate: details.graduation_year ? `${details.graduation_year - 4}` : "",
            endDate: details.graduation_year ? `${details.graduation_year}` : "Present",
            cgpaOrMarks: details.cgpa ? `CGPA: ${details.cgpa}/10.0` : "",
          },
        ]
      : [],
    skills: {
      technical: details?.skills || [],
      soft: details?.soft_skills || [],
      toolsAndFrameworks: [],
    },
    projects: (details?.projects || []).map((p: any, idx: number) => ({
      id: p.id || `proj-${idx + 1}`,
      title: p.title || "Project",
      subtitle: "",
      techStack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
      link: p.link || "",
      startDate: "",
      endDate: "",
      description: p.description ? `• ${p.description}` : "",
    })),
    experience: (details?.experience || []).map((exp: any, idx: number) => ({
      id: exp.id || `exp-${idx + 1}`,
      role: exp.role || "Intern",
      company: exp.company || "Company",
      location: "",
      startDate: exp.duration?.split("-")[0]?.trim() || "",
      endDate: exp.duration?.split("-")[1]?.trim() || "",
      current: false,
      description: exp.description ? `• ${exp.description}` : "",
    })),
    certifications: [],
    achievements: [],
    summary: details?.qualification
      ? `Dedicated ${details.qualification} candidate in ${details.course || "Engineering"} with a solid foundation in ${
          (details.skills || []).slice(0, 3).join(", ") || "software development"
        }. Enthusiastic about contributing to impactful engineering teams.`
      : "",
  };

  return { success: true, data: resumeData };
}

/**
 * Executes secure AI-assisted rewriting for a specific resume section.
 */
export async function rewriteResumeContentAction(params: {
  section: "summary" | "project" | "experience";
  originalText: string;
  context?: { role?: string; skills?: string[] };
}): Promise<{
  success: boolean;
  data?: AIRewriteOutput;
  isFallback?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData?.user) {
    return { success: false, error: "Authentication required." };
  }

  return rewriteResumeContent(params.section, params.originalText, params.context);
}

/**
 * Uploads a student resume PDF to private Supabase storage.
 * Enforces authenticated session, PDF mime type, and 5MB limit.
 */
export async function uploadResumeFileAction(formData: FormData): Promise<{
  success: boolean;
  filePath?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required to upload resume." };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "No file provided." };
  }

  if (file.type !== "application/pdf") {
    return { success: false, error: "Only PDF documents (.pdf) are permitted." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File exceeds 5MB size limit." };
  }

  const filePath = `${user.id}/${Date.now()}-resume.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(filePath, file, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  // Update student_details.resume_url if profile exists
  await supabase
    .from("student_details")
    .update({ resume_url: filePath, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return { success: true, filePath };
}

