import { NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
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
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next");
  const safeNext = getSafeRedirectPath(rawNext);
  const errorDescription = searchParams.get("error_description");

  // 1. If Supabase returned an explicit error parameter, relay it
  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription)}`
    );
  }

  const supabase = await createClient();

  // 2. PKCE code exchange flow (standard web signups & OAuth)
  if (code) {
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

  // 3. Email verification token_hash flow (email confirmation links)
  if (token_hash && type) {
    const { data: sessionData, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      const user = sessionData?.user;
      if (user?.user_metadata?.company_name && user?.user_metadata?.designation) {
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

  // 4. Fallback client-side bridge for hash fragments (#access_token=... or #error=...)
  // Hash fragments are never sent to the server in HTTP requests. If Supabase redirected
  // with an implicit hash fragment, client-side JS inspects it and recovers the session.
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verifying Session...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #090d16;
      color: #f8fafc;
    }
    .card {
      text-align: center;
      max-width: 420px;
      padding: 2.5rem;
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: #0f172a;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: #3b82f6;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h3 style="margin: 0 0 0.5rem; font-size: 18px;">Completing Verification...</h3>
    <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
      Confirming your credentials and establishing your session.
    </p>
  </div>
  <script>
    (function() {
      var hash = window.location.hash;
      if (hash && hash.indexOf("access_token") !== -1) {
        // Hash fragment contains session tokens. Redirect to dashboard.
        window.location.replace("${origin}${safeNext}");
      } else if (hash && hash.indexOf("error_description") !== -1) {
        var params = new URLSearchParams(hash.substring(1));
        var err = params.get("error_description") || "Authentication failed";
        window.location.replace("${origin}/auth/login?error=" + encodeURIComponent(err));
      } else {
        window.location.replace("${origin}/auth/login?error=InvalidOrExpiredLink");
      }
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
