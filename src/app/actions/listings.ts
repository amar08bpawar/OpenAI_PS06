"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WorkMode, ListingStatus } from "@/types/database";

export async function createJobAction(formData: {
  companyId: string;
  title: string;
  description: string;
  salaryPackage: string;
  location: string;
  workMode: WorkMode;
  requiredSkills: string[];
  minCgpa: number;
  eligibleQualifications: string[];
  eligibleCourses: string[];
  eligibleGraduationYears: number[];
  applicationDeadline: string;
  selectionProcess?: string;
  status?: ListingStatus;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  // Verify recruiter or admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "recruiter" && profile?.role !== "administrator") {
    return { success: false, error: "Only verified recruiters or administrators can publish jobs." };
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      company_id: formData.companyId,
      recruiter_id: user.id,
      title: formData.title,
      description: formData.description,
      salary_package: formData.salaryPackage,
      location: formData.location,
      work_mode: formData.workMode,
      required_skills: formData.requiredSkills,
      min_cgpa: formData.minCgpa,
      eligible_qualifications: formData.eligibleQualifications,
      eligible_courses: formData.eligibleCourses,
      eligible_graduation_years: formData.eligibleGraduationYears,
      application_deadline: formData.applicationDeadline,
      selection_process: formData.selectionProcess || "",
      status: formData.status || "published",
      approval_status: "pending",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/jobs");
  revalidatePath("/recruiter/jobs");

  return { success: true, job: data };
}

export async function updateJobAction(
  jobId: string,
  formData: Partial<{
    title: string;
    description: string;
    salaryPackage: string;
    location: string;
    workMode: WorkMode;
    requiredSkills: string[];
    minCgpa: number;
    eligibleQualifications: string[];
    eligibleCourses: string[];
    eligibleGraduationYears: number[];
    applicationDeadline: string;
    selectionProcess?: string;
    status: ListingStatus;
  }>
) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "recruiter" && profile?.role !== "administrator") {
    return { success: false, error: "Only verified recruiters or administrators can update jobs." };
  }

  const updatePayload: any = {};
  if (formData.title !== undefined) updatePayload.title = formData.title;
  if (formData.description !== undefined) updatePayload.description = formData.description;
  if (formData.salaryPackage !== undefined) updatePayload.salary_package = formData.salaryPackage;
  if (formData.location !== undefined) updatePayload.location = formData.location;
  if (formData.workMode !== undefined) updatePayload.work_mode = formData.workMode;
  if (formData.requiredSkills !== undefined) updatePayload.required_skills = formData.requiredSkills;
  if (formData.minCgpa !== undefined) updatePayload.min_cgpa = formData.minCgpa;
  if (formData.eligibleQualifications !== undefined) updatePayload.eligible_qualifications = formData.eligibleQualifications;
  if (formData.eligibleCourses !== undefined) updatePayload.eligible_courses = formData.eligibleCourses;
  if (formData.eligibleGraduationYears !== undefined) updatePayload.eligible_graduation_years = formData.eligibleGraduationYears;
  if (formData.applicationDeadline !== undefined) updatePayload.application_deadline = formData.applicationDeadline;
  if (formData.selectionProcess !== undefined) updatePayload.selection_process = formData.selectionProcess;
  if (formData.status !== undefined) updatePayload.status = formData.status;

  let query = supabase.from("jobs").update(updatePayload).eq("id", jobId);
  if (profile?.role !== "administrator") {
    query = query.eq("recruiter_id", user.id);
  }

  const { error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/recruiter/jobs");

  return { success: true };
}

export async function createInternshipAction(formData: {
  companyId: string;
  title: string;
  description: string;
  stipend: string;
  duration: string;
  location: string;
  workMode: WorkMode;
  requiredSkills: string[];
  minCgpa: number;
  eligibleQualifications: string[];
  eligibleCourses: string[];
  eligibleGraduationYears: number[];
  applicationDeadline: string;
  status?: ListingStatus;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "recruiter" && profile?.role !== "administrator") {
    return { success: false, error: "Only verified recruiters or administrators can publish internships." };
  }

  const { data, error } = await supabase
    .from("internships")
    .insert({
      company_id: formData.companyId,
      recruiter_id: user.id,
      title: formData.title,
      description: formData.description,
      stipend: formData.stipend,
      duration: formData.duration,
      location: formData.location,
      work_mode: formData.workMode,
      required_skills: formData.requiredSkills,
      min_cgpa: formData.minCgpa,
      eligible_qualifications: formData.eligibleQualifications,
      eligible_courses: formData.eligibleCourses,
      eligible_graduation_years: formData.eligibleGraduationYears,
      application_deadline: formData.applicationDeadline,
      status: formData.status || "published",
      approval_status: "pending",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/internships");
  revalidatePath("/recruiter/jobs");

  return { success: true, internship: data };
}

export async function updateInternshipAction(
  internshipId: string,
  formData: Partial<{
    title: string;
    description: string;
    stipend: string;
    duration: string;
    location: string;
    workMode: WorkMode;
    requiredSkills: string[];
    minCgpa: number;
    eligibleQualifications: string[];
    eligibleCourses: string[];
    eligibleGraduationYears: number[];
    applicationDeadline: string;
    status: ListingStatus;
  }>
) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "recruiter" && profile?.role !== "administrator") {
    return { success: false, error: "Only verified recruiters or administrators can update internships." };
  }

  const updatePayload: any = {};
  if (formData.title !== undefined) updatePayload.title = formData.title;
  if (formData.description !== undefined) updatePayload.description = formData.description;
  if (formData.stipend !== undefined) updatePayload.stipend = formData.stipend;
  if (formData.duration !== undefined) updatePayload.duration = formData.duration;
  if (formData.location !== undefined) updatePayload.location = formData.location;
  if (formData.workMode !== undefined) updatePayload.work_mode = formData.workMode;
  if (formData.requiredSkills !== undefined) updatePayload.required_skills = formData.requiredSkills;
  if (formData.minCgpa !== undefined) updatePayload.min_cgpa = formData.minCgpa;
  if (formData.eligibleQualifications !== undefined) updatePayload.eligible_qualifications = formData.eligibleQualifications;
  if (formData.eligibleCourses !== undefined) updatePayload.eligible_courses = formData.eligibleCourses;
  if (formData.eligibleGraduationYears !== undefined) updatePayload.eligible_graduation_years = formData.eligibleGraduationYears;
  if (formData.applicationDeadline !== undefined) updatePayload.application_deadline = formData.applicationDeadline;
  if (formData.status !== undefined) updatePayload.status = formData.status;

  let query = supabase.from("internships").update(updatePayload).eq("id", internshipId);
  if (profile?.role !== "administrator") {
    query = query.eq("recruiter_id", user.id);
  }

  const { error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/internships");
  revalidatePath(`/internships/${internshipId}`);
  revalidatePath("/recruiter/jobs");

  return { success: true };
}

export async function createCompanyAction(formData: {
  name: string;
  logoUrl?: string;
  description: string;
  location: string;
  industry: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "recruiter" && profile?.role !== "administrator") {
    return { success: false, error: "Only verified recruiters or administrators can register companies." };
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: formData.name,
      logo_url: formData.logoUrl || null,
      description: formData.description,
      location: formData.location,
      industry: formData.industry,
      website: formData.website || null,
      contact_email: formData.contactEmail || null,
      contact_phone: formData.contactPhone || null,
      created_by: user.id,
      is_verified: profile?.role === "administrator",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/companies");
  revalidatePath("/recruiter/company");

  return { success: true, company: data };
}
