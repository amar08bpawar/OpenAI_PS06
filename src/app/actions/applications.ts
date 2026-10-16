"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus, ApplicationType } from "@/types/database";

const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  Applied: ["Shortlisted", "Rejected", "Withdrawn"],
  Shortlisted: ["Interview", "Rejected", "Withdrawn"],
  Interview: ["Selected", "Rejected", "Withdrawn"],
  Selected: ["Withdrawn"],
  Rejected: [],
  Withdrawn: [],
};

export async function applyForPosition(formData: {
  targetId: string;
  type: ApplicationType;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "You must be signed in to apply for positions." };
  }

  // 1. Fetch user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") {
    return { success: false, error: "Only verified student accounts can apply for placement positions." };
  }

  // 2. Insert application record
  const payload: any = {
    student_id: user.id,
    type: formData.type,
    status: "Applied",
    notes: formData.notes || null,
  };

  if (formData.type === "job") {
    payload.job_id = formData.targetId;
  } else {
    payload.internship_id = formData.targetId;
  }

  const { data, error } = await supabase
    .from("applications")
    .insert(payload)
    .select()
    .single();

  if (error) {
    if (error.code === "23505" || error.message.includes("duplicate") || error.message.includes("unique")) {
      return { success: false, error: "You have already submitted an application for this position." };
    }
    return { success: false, error: error.message || "Failed to submit application." };
  }

  revalidatePath("/jobs");
  revalidatePath("/internships");
  revalidatePath("/dashboard/applications");

  return { success: true, application: data };
}

export async function updateApplicationStatus(params: {
  applicationId: string;
  newStatus: ApplicationStatus;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  // 1. Fetch current application with related job / internship recruiter info
  const { data: appData, error: fetchError } = await supabase
    .from("applications")
    .select(`
      id,
      student_id,
      status,
      type,
      job_id,
      internship_id,
      jobs:job_id (recruiter_id),
      internships:internship_id (recruiter_id)
    `)
    .eq("id", params.applicationId)
    .single();

  if (fetchError || !appData) {
    return { success: false, error: "Application not found." };
  }

  const currentStatus = appData.status as ApplicationStatus;
  const isStudentOwner = appData.student_id === user.id;

  // Determine recruiter ownership
  const jobRecruiterId = (appData as any).jobs?.recruiter_id;
  const internshipRecruiterId = (appData as any).internships?.recruiter_id;
  const isAuthorizedRecruiter =
    jobRecruiterId === user.id || internshipRecruiterId === user.id;

  // 2. Validate Student Withdrawal
  if (isStudentOwner && !isAuthorizedRecruiter) {
    if (params.newStatus !== "Withdrawn") {
      return { success: false, error: "Students are only permitted to withdraw applications." };
    }
    if (currentStatus === "Withdrawn" || currentStatus === "Rejected") {
      return { success: false, error: `Application is already ${currentStatus}.` };
    }
  } else if (!isAuthorizedRecruiter) {
    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "administrator") {
      return { success: false, error: "Unauthorized: You do not manage this listing." };
    }
  }

  // 3. State transition rule check
  const allowedNext = VALID_TRANSITIONS[currentStatus];
  if (!allowedNext.includes(params.newStatus)) {
    return {
      success: false,
      error: `Invalid transition: Cannot change status from '${currentStatus}' to '${params.newStatus}'.`,
    };
  }

  // 4. Update status
  const { error: updateError } = await supabase
    .from("applications")
    .update({ status: params.newStatus })
    .eq("id", params.applicationId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/dashboard/applications");
  revalidatePath("/recruiter/jobs");

  return { success: true };
}
