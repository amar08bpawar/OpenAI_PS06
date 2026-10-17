"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserRoleInfo {
  authenticated: boolean;
  userId?: string;
  role?: string;
  isVerifiedRecruiter: boolean;
  hasPendingMembership: boolean;
  companyName?: string;
  designation?: string;
  redirectUrl: string;
}

/**
 * Determines the authenticated user's role and portal destination.
 * Pending recruiters may visit /recruiter to see their status,
 * but protected recruiter operations must verify membership separately.
 */
export async function getUserRoleAction(): Promise<UserRoleInfo> {
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  const user = authError ? null : authData?.user;

  if (!user) {
    return {
      authenticated: false,
      isVerifiedRecruiter: false,
      hasPendingMembership: false,
      redirectUrl: "/auth/login",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "student";

  const { data: membership } = await supabase
    .from("recruiter_memberships")
    .select("company_name, designation, is_verified")
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdministrator = role === "administrator";

  const isVerifiedRecruiter =
    isAdministrator ||
    (role === "recruiter" && membership?.is_verified === true);

  const hasPendingMembership = Boolean(
    membership && membership.is_verified !== true
  );

  let redirectUrl = "/dashboard";

  if (isAdministrator || role === "recruiter" || hasPendingMembership) {
    redirectUrl = "/recruiter";
  }

  return {
    authenticated: true,
    userId: user.id,
    role,
    isVerifiedRecruiter,
    hasPendingMembership,
    companyName: membership?.company_name || undefined,
    designation: membership?.designation || undefined,
    redirectUrl,
  };
}

/**
 * Records a pending recruiter membership.
 * Verification must be performed through a trusted administrative process.
 */
export async function recordRecruiterSignupAction(formData: {
  companyName: string;
  designation: string;
}) {
  if (
    !formData ||
    typeof formData.companyName !== "string" ||
    typeof formData.designation !== "string"
  ) {
    return {
      success: false,
      error: "Invalid registration details.",
    };
  }

  const companyName = formData.companyName.trim();
  const designation = formData.designation.trim();

  if (
    companyName.length < 2 ||
    companyName.length > 150 ||
    designation.length < 2 ||
    designation.length > 100
  ) {
    return {
      success: false,
      error:
        "Company name must be 2–150 characters and designation must be 2–100 characters.",
    };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  const user = authError ? null : authData?.user;

  if (!user) {
    return {
      success: false,
      error: "Authentication required to register a recruiter organization.",
    };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("recruiter_memberships")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError) {
    return {
      success: false,
      error: "Unable to check existing recruiter registration.",
    };
  }

  if (existing) {
    return {
      success: true,
      alreadyExists: true,
    };
  }

  const { error: insertError } = await supabase
    .from("recruiter_memberships")
    .insert({
      user_id: user.id,
      company_name: companyName,
      designation,
      is_verified: false,
    });

  if (insertError) {
    // A unique constraint may have prevented a duplicate concurrent request.
    if (insertError.code === "23505") {
      return {
        success: true,
        alreadyExists: true,
      };
    }

    return {
      success: false,
      error: "Unable to save recruiter registration. Please try again.",
    };
  }

  revalidatePath("/recruiter");

  return {
    success: true,
  };
}