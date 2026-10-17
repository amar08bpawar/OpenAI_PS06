import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeRedirectPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return "/dashboard";
  }
  return value;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const safeNext = getSafeRedirectPath(rawNext);

  if (code) {
    const supabase = await createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const user = sessionData?.user;
      if (user?.user_metadata?.company_name && user?.user_metadata?.designation) {
        // Record pending recruiter membership if not already present
        const { data: existing } = await supabase
          .from("recruiter_memberships")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from("recruiter_memberships").insert({
            user_id: user.id,
            company_name: user.user_metadata.company_name,
            designation: user.user_metadata.designation,
            is_verified: false,
          });
        }
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Return the user to an error page or login with error instruction
  return NextResponse.redirect(`${origin}/auth/login?error=InvalidOrExpiredLink`);
}
