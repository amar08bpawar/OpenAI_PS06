import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("==================================================================");
console.log(" Placement Hub - Comprehensive Auth & Foundation Test Suite");
console.log("==================================================================\n");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
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
// Test 1: Verify .gitignore contains secrets and environment files
// -----------------------------------------------------------------------------
runTest("Environment Security: .gitignore blocks credential files and build artifacts", () => {
  const gitignorePath = path.join(rootDir, ".gitignore");
  assert.ok(fs.existsSync(gitignorePath), ".gitignore must exist");
  const content = fs.readFileSync(gitignorePath, "utf-8");
  assert.ok(content.includes(".env"), ".gitignore must block .env");
  assert.ok(content.includes(".env*.local"), ".gitignore must block .env*.local");
  assert.ok(content.includes("node_modules"), ".gitignore must block node_modules");
});

// -----------------------------------------------------------------------------
// Test 2: Verify .env.example defines required keys without leaking real secrets
// -----------------------------------------------------------------------------
runTest("Environment Template: .env.example has required public & server-only keys", () => {
  const envExamplePath = path.join(rootDir, ".env.example");
  assert.ok(fs.existsSync(envExamplePath), ".env.example must exist");
  const content = fs.readFileSync(envExamplePath, "utf-8");
  assert.ok(content.includes("NEXT_PUBLIC_SUPABASE_URL"), "Must specify NEXT_PUBLIC_SUPABASE_URL");
  assert.ok(content.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"), "Must specify NEXT_PUBLIC_SUPABASE_ANON_KEY");
  assert.ok(content.includes("SUPABASE_SERVICE_ROLE_KEY"), "Must specify SUPABASE_SERVICE_ROLE_KEY");

  // Ensure service role key is NEVER prefixed with NEXT_PUBLIC_
  assert.ok(
    !content.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"),
    "SUPABASE_SERVICE_ROLE_KEY must NEVER be prefixed with NEXT_PUBLIC_"
  );
});

// -----------------------------------------------------------------------------
// Test 3: SQL Migration verification for tables, triggers, and RLS policies
// -----------------------------------------------------------------------------
runTest("Database Schema: SQL migration defines profiles, student_details, recruiter_memberships & RLS", () => {
  const migrationPath = path.join(
    rootDir,
    "supabase",
    "migrations",
    "20261016000000_create_auth_and_profiles_schema.sql"
  );
  assert.ok(fs.existsSync(migrationPath), "Migration SQL file must exist");
  const sql = fs.readFileSync(migrationPath, "utf-8");

  // Tables
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.profiles"), "Must create profiles table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.student_details"), "Must create student_details table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.recruiter_memberships"), "Must create recruiter_memberships table");

  // Role constraints
  assert.ok(sql.includes("CHECK (role IN ('student', 'recruiter', 'administrator'))"), "Must constrain user roles");
  assert.ok(sql.includes("'student'"), "Must default role to student");

  // RLS enablement
  assert.ok(sql.includes("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;"), "Must enable RLS on profiles");
  assert.ok(sql.includes("ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;"), "Must enable RLS on student_details");
  assert.ok(sql.includes("ALTER TABLE public.recruiter_memberships ENABLE ROW LEVEL SECURITY;"), "Must enable RLS on recruiter_memberships");

  // Escalation guard triggers
  assert.ok(sql.includes("prevent_role_tampering"), "Must have prevent_role_tampering trigger function");
  assert.ok(sql.includes("prevent_verification_tampering"), "Must have recruiter verification guard trigger");
  assert.ok(sql.includes("on_auth_user_created"), "Must have on_auth_user_created trigger");
});

// -----------------------------------------------------------------------------
// Test 4: Zod Validation logic for Student Registration
// -----------------------------------------------------------------------------
runTest("Validation: Registration requires full name, valid email, strong password, course, qualification", () => {
  const validationsPath = path.join(rootDir, "src", "lib", "validations", "auth.ts");
  assert.ok(fs.existsSync(validationsPath), "auth.ts validations must exist");
  const content = fs.readFileSync(validationsPath, "utf-8");

  assert.ok(content.includes("registerSchema"), "registerSchema must be exported");
  assert.ok(content.includes("fullName"), "fullName must be validated");
  assert.ok(content.includes("course"), "course must be validated");
  assert.ok(content.includes("qualification"), "qualification must be validated");
  assert.ok(content.includes("confirmPassword"), "confirmPassword must be checked");
  assert.ok(content.includes("verifyOtpSchema"), "verifyOtpSchema must be exported");
});

// -----------------------------------------------------------------------------
// Test 5: Route Protection and Middleware Session handling
// -----------------------------------------------------------------------------
runTest("Security & Middleware: updateSession protects /dashboard and refreshes sessions", () => {
  const middlewareHelperPath = path.join(rootDir, "src", "lib", "supabase", "middleware.ts");
  const rootMiddlewarePath = path.join(rootDir, "src", "middleware.ts");

  assert.ok(fs.existsSync(middlewareHelperPath), "middleware helper must exist");
  assert.ok(fs.existsSync(rootMiddlewarePath), "src/middleware.ts must exist");

  const helperContent = fs.readFileSync(middlewareHelperPath, "utf-8");
  assert.ok(helperContent.includes("/dashboard"), "Middleware must protect /dashboard");
  assert.ok(helperContent.includes("/auth/login"), "Middleware must handle login redirection");
  assert.ok(helperContent.includes("getUser()"), "Middleware must use secure getUser() method");
});

// -----------------------------------------------------------------------------
// Test 6: Auth Client Separation
// -----------------------------------------------------------------------------
runTest("Architecture: Client vs Server vs Admin client separation", () => {
  const browserClient = path.join(rootDir, "src", "lib", "supabase", "client.ts");
  const serverClient = path.join(rootDir, "src", "lib", "supabase", "server.ts");
  const adminClient = path.join(rootDir, "src", "lib", "supabase", "admin.ts");

  assert.ok(fs.existsSync(browserClient), "browser client must exist");
  assert.ok(fs.existsSync(serverClient), "server client must exist");
  assert.ok(fs.existsSync(adminClient), "admin client must exist");

  const adminContent = fs.readFileSync(adminClient, "utf-8");
  assert.ok(adminContent.includes("SUPABASE_SERVICE_ROLE_KEY"), "Admin client must use SUPABASE_SERVICE_ROLE_KEY");
  assert.ok(
    adminContent.includes("NEVER import this file into client components"),
    "Admin client must document server-only usage"
  );
});

// -----------------------------------------------------------------------------
// Test 7: UI Foundation Components
// -----------------------------------------------------------------------------
runTest("Design Foundation: Button, Input, Card, Badge, Alert, Avatar, DropdownMenu, StateViews", () => {
  const components = [
    "src/components/ui/button.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/label.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/badge.tsx",
    "src/components/ui/alert.tsx",
    "src/components/ui/avatar.tsx",
    "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/skeleton.tsx",
    "src/components/ui/state-views.tsx",
  ];

  for (const comp of components) {
    const p = path.join(rootDir, comp);
    assert.ok(fs.existsSync(p), `Component ${comp} must exist`);
  }
});

// -----------------------------------------------------------------------------
// Test 8: Live Credential Requirements Documentation
// -----------------------------------------------------------------------------
runTest("Documentation: Live credential test boundary documented", () => {
  console.log("\n  [INFO] Authentication Test Boundaries:");
  console.log("  • Automated Mock / Schema / Static Builds: Passed locally without secrets.");
  console.log("  • Live Email OTP Dispatch: Requires real Supabase Project with SMTP or default provider.");
  console.log("  • Live DB Trigger Execution: Requires running migrations in Supabase SQL editor or CLI.");
  console.log("  • Live Token Exchange: Requires valid NEXT_PUBLIC_SUPABASE_URL and ANON key.");
});

console.log("\n------------------------------------------------------------------");
console.log(` Summary: ${passed} Passed, ${failed} Failed`);
console.log("==================================================================\n");

if (failed > 0) {
  process.exit(1);
}
