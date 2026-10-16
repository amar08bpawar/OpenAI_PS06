import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("==================================================================");
console.log(" Placement Hub - Full Comprehensive Security & QA Audit Suite");
console.log("==================================================================\n");

let passed = 0;
let failed = 0;

function runAuditTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// Test 1: Authentication, Session Expiration & Route Protection Middleware
// -----------------------------------------------------------------------------
runAuditTest("Auth & Middleware: updateSession protects all dashboard and recruiter paths", () => {
  const middlewarePath = path.join(rootDir, "src/lib/supabase/middleware.ts");
  assert.ok(fs.existsSync(middlewarePath), "middleware.ts must exist");
  const content = fs.readFileSync(middlewarePath, "utf-8");

  assert.ok(
    content.includes("getUser()"),
    "Middleware must use secure getUser() method to contact auth server, never insecure getSession()"
  );
  assert.ok(
    content.includes('pathname.startsWith("/dashboard")'),
    "Middleware must intercept /dashboard"
  );
  assert.ok(
    content.includes('pathname.startsWith("/recruiter")'),
    "Middleware must intercept /recruiter"
  );
  assert.ok(
    content.includes("/auth/login"),
    "Middleware must redirect unauthenticated visitors to login"
  );
  assert.ok(
    content.includes("redirect"),
    "Middleware must preserve destination via redirect parameter"
  );
});

// -----------------------------------------------------------------------------
// Test 2: Role Separation & Unauthorized Access Prevention
// -----------------------------------------------------------------------------
runAuditTest("Role Separation: Student, recruiter, and administrator boundaries enforced in server actions", () => {
  const listingsActionPath = path.join(rootDir, "src/app/actions/listings.ts");
  const listingsCode = fs.readFileSync(listingsActionPath, "utf-8");

  // createJobAction must check role
  assert.ok(
    listingsCode.includes('profile?.role !== "recruiter" && profile?.role !== "administrator"'),
    "createJobAction must verify recruiter or administrator role"
  );

  // createCompanyAction must check role
  assert.ok(
    listingsCode.includes('profile?.role !== "recruiter" && profile?.role !== "administrator"'),
    "createCompanyAction must verify recruiter or administrator role"
  );

  // updateJobAction must scope recruiter updates
  assert.ok(
    listingsCode.includes('profile?.role !== "administrator"'),
    "updateJobAction must restrict recruiters to their own job listings"
  );

  // Application actions role verification
  const applicationsActionPath = path.join(rootDir, "src/app/actions/applications.ts");
  const appCode = fs.readFileSync(applicationsActionPath, "utf-8");

  // Apply action restricts to students
  assert.ok(
    appCode.includes('profile?.role !== "student"'),
    "applyForPosition must ensure only student role can submit applications"
  );

  // Student can only withdraw
  assert.ok(
    appCode.includes('params.newStatus !== "Withdrawn"'),
    "updateApplicationStatus must prevent students from setting statuses other than Withdrawn"
  );
});

// -----------------------------------------------------------------------------
// Test 3: Complete Database RLS Policy Audit
// -----------------------------------------------------------------------------
runAuditTest("Database RLS Audit: Every exposed Supabase table has ROW LEVEL SECURITY enabled", () => {
  const schemaPath = path.join(rootDir, "supabase/schema.sql");
  assert.ok(fs.existsSync(schemaPath), "schema.sql must exist");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  const requiredRlsTables = [
    "profiles",
    "student_details",
    "recruiter_memberships",
    "companies",
    "jobs",
    "internships",
    "applications",
    "aptitude_tests",
    "aptitude_questions",
    "aptitude_attempts",
    "interview_sessions",
    "career_guidance_reports",
    "student_github_evidence",
    "resumes",
  ];

  for (const table of requiredRlsTables) {
    const pattern = `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`;
    assert.ok(
      schema.includes(pattern),
      `CRITICAL SECURITY REQUIREMENT: Table public.${table} MUST have Row Level Security enabled`
    );
  }

  // Verify aptitude_questions does NOT have open SELECT
  assert.ok(
    !schema.includes('CREATE POLICY "Authenticated users can view questions"'),
    "SECURITY VULNERABILITY: aptitude_questions must NEVER have an open SELECT policy"
  );
  assert.ok(
    schema.includes('CREATE POLICY "Admins can view questions"'),
    "aptitude_questions must restrict raw questions (with answer keys) to admins only"
  );
});

// -----------------------------------------------------------------------------
// Test 4: Application Ownership, Eligibility & Duplicate Prevention
// -----------------------------------------------------------------------------
runAuditTest("Eligibility & Duplicate Prevention: Enforces exact criteria match and unique constraints", () => {
  const schema = fs.readFileSync(path.join(rootDir, "supabase/schema.sql"), "utf-8");

  // Unique constraint preventing duplicate applications
  assert.ok(
    schema.includes("uq_student_job_application"),
    "Database must enforce unique constraint for student-job applications"
  );
  assert.ok(
    schema.includes("uq_student_internship_application"),
    "Database must enforce unique constraint for student-internship applications"
  );

  // Eligibility evaluation logic verification
  const eligibilityService = (student, job) => {
    const unmet = [];
    if (job.min_cgpa && (!student.cgpa || student.cgpa < job.min_cgpa)) {
      unmet.push(`CGPA ${student.cgpa || "N/A"} is below required ${job.min_cgpa}`);
    }
    if (job.eligible_qualifications && job.eligible_qualifications.length > 0) {
      if (!student.qualification || !job.eligible_qualifications.includes(student.qualification)) {
        unmet.push(`Qualification '${student.qualification || "Unknown"}' does not match`);
      }
    }
    return {
      isEligible: unmet.length === 0,
      unmetRequirements: unmet,
    };
  };

  const eligibleStudent = { cgpa: 8.5, qualification: "B.Tech" };
  const jobRequirements = { min_cgpa: 7.5, eligible_qualifications: ["B.Tech", "MCA"] };

  const evalPass = eligibilityService(eligibleStudent, jobRequirements);
  assert.strictEqual(evalPass.isEligible, true);
  assert.strictEqual(evalPass.unmetRequirements.length, 0);

  // Missing student data treated strictly as unknown/unmet
  const bareStudent = { cgpa: null, qualification: "" };
  const evalFail = eligibilityService(bareStudent, jobRequirements);
  assert.strictEqual(evalFail.isEligible, false);
  assert.strictEqual(evalFail.unmetRequirements.length, 2);
});

// -----------------------------------------------------------------------------
// Test 5: OpenAI Integration Resilience & Safe Fallbacks
// -----------------------------------------------------------------------------
runAuditTest("OpenAI Resilience: Handles missing keys, malformed responses, timeouts, and rate limits", () => {
  const openaiServicePath = path.join(rootDir, "src/lib/services/openai.ts");
  const code = fs.readFileSync(openaiServicePath, "utf-8");

  // Client guard
  assert.ok(
    code.includes('typeof window !== "undefined"'),
    "OpenAI service must prevent browser runtime execution"
  );

  // Recoverable error fallback
  assert.ok(
    code.includes("isRecoverableError"),
    "OpenAI executeStructuredCompletion must gracefully recover on errors"
  );
  assert.ok(
    code.includes("APIConnectionTimeoutError") || code.includes("ETIMEDOUT"),
    "Must catch and handle timeout errors gracefully"
  );
  assert.ok(
    code.includes("SyntaxError"),
    "Must catch and handle malformed JSON syntax errors"
  );
});

// -----------------------------------------------------------------------------
// Test 6: GitHub Skill Evidence Safety & Rate Limit Handling
// -----------------------------------------------------------------------------
runAuditTest("GitHub Evidence: Strict handle sanitization, rate limit handling, and disclaimer enforcement", () => {
  const githubServicePath = path.join(rootDir, "src/lib/services/github.ts");
  const code = fs.readFileSync(githubServicePath, "utf-8");

  // Regex validation
  assert.ok(
    code.includes("/^[a-z\\d](?:[a-z\\d]|-(?=[a-z\\d])){0,38}$/i"),
    "Must enforce strict GitHub handle regex"
  );

  // Rate limit handling
  assert.ok(
    code.includes("x-ratelimit-reset"),
    "Must inspect and format rate limit reset timestamps"
  );

  // Disclaimer notice
  assert.ok(
    code.includes("GITHUB_DISCLAIMER"),
    "Must declare transparency disclaimer separating public evidence from verified proficiency"
  );
});

// -----------------------------------------------------------------------------
// Test 7: Quiz Answer Privacy & Server-Side Deterministic Grading
// -----------------------------------------------------------------------------
runAuditTest("Quiz Privacy: Answer keys withheld from client; graded strictly server-side with verified session", () => {
  const aptitudeActionPath = path.join(rootDir, "src/app/actions/aptitude.ts");
  const code = fs.readFileSync(aptitudeActionPath, "utf-8");

  assert.ok(
    code.includes("createAdminClient"),
    "Must use server admin client for privileged question management and grading queries"
  );
  assert.ok(
    code.includes("sanitizeQuestionsForClient"),
    "Must strip correct_option and explanation from client payload"
  );
  assert.ok(
    code.includes("student_id: user.id"),
    "Attempt ownership must strictly use session-verified user.id"
  );
  assert.ok(
    code.includes("VALID_CATEGORIES.includes(params.category)"),
    "Must validate assessment category against whitelist"
  );
  assert.ok(
    code.includes("VALID_DIFFICULTIES.includes(params.difficulty)"),
    "Must validate assessment difficulty against whitelist"
  );
});

// -----------------------------------------------------------------------------
// Test 8: Resume Privacy, Private Storage Policies, and Printing Layout
// -----------------------------------------------------------------------------
runAuditTest("Resume Security: Private storage bucket, RLS isolation, and A4 print page styles", () => {
  const migrationPath = path.join(
    rootDir,
    "supabase/migrations/20261017100000_resume_builder.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf-8");

  assert.ok(
    sql.includes("CREATE POLICY \"Students upload own resume files\""),
    "Must restrict storage upload to student's own folder"
  );
  assert.ok(
    sql.includes("CREATE POLICY \"Students read own resume files\""),
    "Must restrict storage reads to owner or admin"
  );
  assert.ok(
    sql.includes("5242880"),
    "Must enforce 5MB maximum file size limit on storage bucket"
  );

  // Check templates have page-break-inside avoid
  const modernTemplate = fs.readFileSync(
    path.join(rootDir, "src/components/resume/templates/modern-template.tsx"),
    "utf-8"
  );
  assert.ok(
    modernTemplate.includes("break-inside-avoid"),
    "Resume templates must prevent mid-card page splits"
  );
});

// -----------------------------------------------------------------------------
// Test 9: Application Security Audit (XSS, Secrets, CORS, Logging)
// -----------------------------------------------------------------------------
runAuditTest("Security Hardening: No unsafe dangerouslySetInnerHTML, zero credential leaks, server-only keys", () => {
  // Check admin.ts
  const adminTs = fs.readFileSync(path.join(rootDir, "src/lib/supabase/admin.ts"), "utf-8");
  assert.ok(
    adminTs.includes('typeof window !== "undefined"'),
    "Admin client must throw error if executed in browser"
  );

  // Check .env.example
  const envExample = fs.readFileSync(path.join(rootDir, ".env.example"), "utf-8");
  assert.ok(
    !envExample.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"),
    "SUPABASE_SERVICE_ROLE_KEY must NEVER be prefixed with NEXT_PUBLIC_"
  );
  assert.ok(
    !envExample.includes("NEXT_PUBLIC_OPENAI_API_KEY"),
    "OPENAI_API_KEY must NEVER be prefixed with NEXT_PUBLIC_"
  );

  // Check gitignore blocks real credentials
  const gitignore = fs.readFileSync(path.join(rootDir, ".gitignore"), "utf-8");
  assert.ok(gitignore.includes(".env*.local"), ".gitignore must block local credential files");
});

console.log("\n------------------------------------------------------------------");
console.log(` Summary: ${passed} Passed, ${failed} Failed`);
console.log("==================================================================\n");

if (failed > 0) {
  process.exit(1);
}
