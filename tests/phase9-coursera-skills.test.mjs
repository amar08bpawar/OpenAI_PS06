import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("==================================================================");
console.log(" Placement Hub - Phase 9 Coursera Skill Development & Favicon Suite");
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

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// Test 1: Coursera API Documentation Research, Key Protection & Env Setup
// -----------------------------------------------------------------------------
runTest("Coursera Integration: Server-side secret protection and honest config status", () => {
  const envExample = fs.readFileSync(path.join(rootDir, ".env.example"), "utf-8");

  // Must have Coursera credentials as server-side only
  assert.ok(
    envExample.includes("COURSERA_CLIENT_ID="),
    ".env.example must define COURSERA_CLIENT_ID"
  );
  assert.ok(
    envExample.includes("COURSERA_CLIENT_SECRET="),
    ".env.example must define COURSERA_CLIENT_SECRET"
  );
  assert.ok(
    !envExample.includes("NEXT_PUBLIC_COURSERA_CLIENT_ID"),
    "COURSERA_CLIENT_ID must NEVER be prefixed with NEXT_PUBLIC_"
  );
  assert.ok(
    !envExample.includes("NEXT_PUBLIC_COURSERA_CLIENT_SECRET"),
    "COURSERA_CLIENT_SECRET must NEVER be prefixed with NEXT_PUBLIC_"
  );

  const courseraService = fs.readFileSync(
    path.join(rootDir, "src/lib/services/coursera.ts"),
    "utf-8"
  );
  assert.ok(
    courseraService.includes("isCourseraApiConfigured"),
    "coursera.ts must export isCourseraApiConfigured function"
  );
  assert.ok(
    courseraService.includes("getCourseraConfigStatus"),
    "coursera.ts must export getCourseraConfigStatus function"
  );
  assert.ok(
    courseraService.includes("dev.coursera.com"),
    "coursera.ts documentation must cite official Coursera Developer Portal requirements"
  );
});

// -----------------------------------------------------------------------------
// Test 2: Verified Coursera Catalog Integrity & Direct Links
// -----------------------------------------------------------------------------
runTest("Coursera Catalog: Verified courses with genuine coursera.org direct links", () => {
  const serviceFile = path.join(rootDir, "src/lib/services/coursera.ts");
  assert.ok(fs.existsSync(serviceFile), "src/lib/services/coursera.ts must exist");
  const content = fs.readFileSync(serviceFile, "utf-8");

  assert.ok(
    content.includes("VERIFIED_COURSERA_CATALOG: CourseraCourse[] = ["),
    "coursera.ts must export VERIFIED_COURSERA_CATALOG"
  );
  assert.ok(
    content.includes("https://www.coursera.org/specializations/machine-learning-introduction"),
    "Catalog must include DeepLearning.AI & Stanford Machine Learning Specialization"
  );
  assert.ok(
    content.includes("https://www.coursera.org/professional-certificates/meta-front-end-developer"),
    "Catalog must include Meta Front-End Developer certificate"
  );
  assert.ok(
    content.includes("https://www.coursera.org/professional-certificates/google-data-analytics"),
    "Catalog must include Google Data Analytics certificate"
  );
  assert.ok(
    content.includes("https://www.coursera.org/professional-certificates/ibm-data-science"),
    "Catalog must include IBM Data Science certificate"
  );
  assert.ok(
    content.includes("https://www.coursera.org/specializations/python"),
    "Catalog must include University of Michigan Python for Everybody"
  );
  assert.ok(
    content.includes("https://www.coursera.org/learn/coding-interview-preparation"),
    "Catalog must include Meta Coding Interview Preparation"
  );

  // Check all course URLs in catalog point to coursera.org
  const urlMatches = content.match(/course_url:\s*"([^"]+)"/g) || [];
  assert.ok(urlMatches.length >= 10, `Expected at least 10 course URLs, found ${urlMatches.length}`);
  for (const match of urlMatches) {
    const url = match.replace(/course_url:\s*"/, "").replace(/"$/, "");
    assert.ok(
      url.startsWith("https://www.coursera.org/"),
      `Course URL must link to https://www.coursera.org/, got: ${url}`
    );
  }

  // Check exported functions
  assert.ok(content.includes("export async function searchCourseraCourses"), "Must export searchCourseraCourses");
  assert.ok(content.includes("export function getRecommendedCoursesForStudent"), "Must export getRecommendedCoursesForStudent");
  assert.ok(content.includes("COURSERA_CATEGORIES = ["), "Must export COURSERA_CATEGORIES");
});

// -----------------------------------------------------------------------------
// Test 3: API Route Handler /api/learning/courses
// -----------------------------------------------------------------------------
runTest("API Route Handler: /api/learning/courses provides search and filtering", () => {
  const routePath = path.join(rootDir, "src/app/api/learning/courses/route.ts");
  assert.ok(fs.existsSync(routePath), "Route handler /api/learning/courses/route.ts must exist");

  const routeContent = fs.readFileSync(routePath, "utf-8");
  assert.ok(
    routeContent.includes("export async function GET"),
    "Route handler must export a GET function"
  );
  assert.ok(
    routeContent.includes("searchCourseraCourses"),
    "Route handler must delegate to searchCourseraCourses service"
  );
  assert.ok(
    routeContent.includes("searchParams.get(\"q\")") || routeContent.includes("searchParams.get('q')"),
    "Route handler must parse query parameter 'q'"
  );
  assert.ok(
    routeContent.includes("searchParams.get(\"category\")") || routeContent.includes("searchParams.get('category')"),
    "Route handler must parse category parameter"
  );
});

// -----------------------------------------------------------------------------
// Test 4: Database Schema & Additive Migration for Saved Courses
// -----------------------------------------------------------------------------
runTest("Database Schema: Additive migration defines student_saved_courses with RLS", () => {
  const migrationPath = path.join(
    rootDir,
    "supabase/migrations/20261017140000_student_saved_courses.sql"
  );
  assert.ok(fs.existsSync(migrationPath), "Migration file 20261017140000_student_saved_courses.sql must exist");

  const migrationSql = fs.readFileSync(migrationPath, "utf-8");
  assert.ok(
    migrationSql.includes("CREATE TABLE IF NOT EXISTS public.student_saved_courses"),
    "Migration must create student_saved_courses table"
  );
  assert.ok(
    migrationSql.includes("uq_student_saved_course UNIQUE (student_id, provider, course_id)"),
    "Migration must enforce unique constraint on (student_id, provider, course_id)"
  );
  assert.ok(
    migrationSql.includes("ENABLE ROW LEVEL SECURITY"),
    "Migration must enable Row Level Security"
  );
  assert.ok(
    migrationSql.includes("student_id = auth.uid()"),
    "RLS policies must isolate student_id to authenticated user"
  );

  // Check master schema.sql
  const masterSchema = fs.readFileSync(path.join(rootDir, "supabase/schema.sql"), "utf-8");
  assert.ok(
    masterSchema.includes("student_saved_courses"),
    "Master schema.sql must be synchronized with student_saved_courses"
  );
});

// -----------------------------------------------------------------------------
// Test 5: Server Actions for Saved Course Management
// -----------------------------------------------------------------------------
runTest("Server Actions: saveCourseAction, removeSavedCourseAction, updateSavedCourseStatusAction", () => {
  const actionsPath = path.join(rootDir, "src/app/actions/learning.ts");
  assert.ok(fs.existsSync(actionsPath), "src/app/actions/learning.ts must exist");

  const actionsContent = fs.readFileSync(actionsPath, "utf-8");
  assert.ok(
    actionsContent.includes('"use server"') || actionsContent.includes("'use server'"),
    "learning.ts must declare 'use server'"
  );
  assert.ok(
    actionsContent.includes("saveCourseAction"),
    "learning.ts must export saveCourseAction"
  );
  assert.ok(
    actionsContent.includes("removeSavedCourseAction"),
    "learning.ts must export removeSavedCourseAction"
  );
  assert.ok(
    actionsContent.includes("updateSavedCourseStatusAction"),
    "learning.ts must export updateSavedCourseStatusAction"
  );
  assert.ok(
    actionsContent.includes("getSavedCoursesAction"),
    "learning.ts must export getSavedCoursesAction"
  );
  assert.ok(
    actionsContent.includes("auth.getUser()"),
    "Server actions must authenticate the user"
  );
  assert.ok(
    actionsContent.includes("student_saved_courses"),
    "Server actions must interact with student_saved_courses table"
  );
});

// -----------------------------------------------------------------------------
// Test 6: Placement Hub Favicon & Branding
// -----------------------------------------------------------------------------
runTest("Branding: Placement Hub icon.svg exists and is registered in layout metadata", () => {
  const iconPath = path.join(rootDir, "src/app/icon.svg");
  assert.ok(fs.existsSync(iconPath), "src/app/icon.svg must exist");

  const iconSvg = fs.readFileSync(iconPath, "utf-8");
  assert.ok(iconSvg.includes("<svg"), "icon.svg must be a valid SVG document");
  assert.ok(
    iconSvg.includes("#2563eb") || iconSvg.includes("#1d4ed8"),
    "icon.svg must incorporate brand primary blue"
  );

  const layoutContent = fs.readFileSync(path.join(rootDir, "src/app/layout.tsx"), "utf-8");
  assert.ok(
    layoutContent.includes("icon: \"/icon.svg\"") || layoutContent.includes("icon: '/icon.svg'"),
    "src/app/layout.tsx must configure icon in metadata"
  );
});

// -----------------------------------------------------------------------------
// Test 7: Navigation & Role Boundary Verification
// -----------------------------------------------------------------------------
runTest("Navigation: Skill Development added to student views; isolated from recruiter views", () => {
  const sidebarContent = fs.readFileSync(
    path.join(rootDir, "src/components/layout/dashboard-sidebar.tsx"),
    "utf-8"
  );
  assert.ok(
    sidebarContent.includes("/dashboard/skills"),
    "Dashboard sidebar must contain /dashboard/skills link"
  );
  assert.ok(
    sidebarContent.includes("Skill Development"),
    "Dashboard sidebar must display 'Skill Development'"
  );

  const mobileNavContent = fs.readFileSync(
    path.join(rootDir, "src/components/layout/mobile-nav.tsx"),
    "utf-8"
  );
  assert.ok(
    mobileNavContent.includes("/dashboard/skills"),
    "Mobile nav must contain /dashboard/skills link"
  );

  const recruiterLayout = fs.readFileSync(
    path.join(rootDir, "src/app/recruiter/layout.tsx"),
    "utf-8"
  );
  assert.ok(
    !recruiterLayout.includes("/dashboard/skills"),
    "Recruiter portal layout must NOT link to /dashboard/skills"
  );

  const dashboardPage = fs.readFileSync(
    path.join(rootDir, "src/app/dashboard/page.tsx"),
    "utf-8"
  );
  assert.ok(
    dashboardPage.includes("/dashboard/skills"),
    "Student dashboard page must link to /dashboard/skills"
  );
  assert.ok(
    dashboardPage.includes("student_saved_courses"),
    "Student dashboard page must query student_saved_courses"
  );
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log("\n------------------------------------------------------------------");
console.log(` Summary: ${passed} Passed, ${failed} Failed`);
console.log("==================================================================\n");

if (failed > 0) {
  process.exit(1);
}
