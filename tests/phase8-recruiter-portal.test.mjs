import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("==================================================================");
console.log(" Placement Hub - Phase 8 Recruiter Portal & Live Jobs Test Suite");
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
// Test 1: Cancel Mandatory OTP on Registration and Login
// -----------------------------------------------------------------------------
runTest("Auth Flow: Password registration & login bypasses mandatory OTP verification", () => {
  const registerFile = fs.readFileSync(path.join(rootDir, "src/app/auth/register/page.tsx"), "utf-8");
  const loginFile = fs.readFileSync(path.join(rootDir, "src/app/auth/login/page.tsx"), "utf-8");

  // Registration does not forcibly route to /auth/verify-otp on submit
  assert.ok(
    !registerFile.includes("router.push(`/auth/verify-otp?email="),
    "RegisterPage must not unconditionally push user to verify-otp page"
  );
  assert.ok(
    registerFile.includes("signInWithPassword"),
    "RegisterPage attempts immediate password login or redirects to login page"
  );

  // Login page prioritizes password authentication and handles unconfirmed email gracefully
  assert.ok(
    loginFile.includes("signInWithPassword"),
    "LoginPage uses signInWithPassword"
  );
  assert.ok(
    !loginFile.includes("Click here to enter your email OTP now"),
    "LoginPage removes forced OTP prompt link"
  );
});

// -----------------------------------------------------------------------------
// Test 2: Complete Recruiter Layout Navigation
// -----------------------------------------------------------------------------
runTest("Recruiter Portal: Role-specific navigation with zero student items", () => {
  const layoutFile = fs.readFileSync(path.join(rootDir, "src/app/recruiter/layout.tsx"), "utf-8");

  // Required recruiter navigation items
  assert.ok(layoutFile.includes('href="/recruiter"'), "Layout has Overview link");
  assert.ok(layoutFile.includes('href="/recruiter/jobs/new"'), "Layout has Post Job link");
  assert.ok(layoutFile.includes('href="/recruiter/jobs"'), "Layout has Manage Jobs link");
  assert.ok(layoutFile.includes('href="/recruiter/applications"'), "Layout has Applications link");
  assert.ok(layoutFile.includes('href="/recruiter/shortlisted"'), "Layout has Shortlisted link");
  assert.ok(layoutFile.includes('href="/recruiter/company"'), "Layout has Company link");
  assert.ok(layoutFile.includes('href="/recruiter/analytics"'), "Layout has Analytics link");
  assert.ok(layoutFile.includes('href="/recruiter/settings"'), "Layout has Settings link");

  // Zero student items in recruiter layout
  assert.ok(
    !layoutFile.includes(">Student View<"),
    "Recruiter layout must not contain Student View button"
  );
});

// -----------------------------------------------------------------------------
// Test 3: Recruiter Dashboard Real Metrics
// -----------------------------------------------------------------------------
runTest("Recruiter Dashboard: Real statistics for jobs, vacancies, pipeline & compensation", () => {
  const dashboardFile = fs.readFileSync(path.join(rootDir, "src/app/recruiter/page.tsx"), "utf-8");

  assert.ok(dashboardFile.includes("activeJobsCount"), "Calculates active full-time jobs");
  assert.ok(dashboardFile.includes("pendingApprovalsCount"), "Calculates pending job approvals");
  assert.ok(dashboardFile.includes("awaitingReviewCount"), "Calculates applications awaiting review");
  assert.ok(dashboardFile.includes("shortlistedCount"), "Calculates shortlisted / interview count");
  assert.ok(dashboardFile.includes("rejectedCount"), "Calculates rejected applications count");
  assert.ok(dashboardFile.includes("parseSalaryToINR"), "Parses salary compensation packages");
  assert.ok(dashboardFile.includes("avgSalaryOffered"), "Computes average salary package offered");
  assert.ok(dashboardFile.includes("recentJobs"), "Lists recent job & vacancy postings");
});

// -----------------------------------------------------------------------------
// Test 4: Recruiter Candidate Management & Shortlisted Pipelines
// -----------------------------------------------------------------------------
runTest("Candidate Pipeline: Dedicated applications & shortlisted candidate workflows", () => {
  const appsPage = path.join(rootDir, "src/app/recruiter/applications/page.tsx");
  const shortlistedPage = path.join(rootDir, "src/app/recruiter/shortlisted/page.tsx");
  const managerComp = path.join(rootDir, "src/components/placement/recruiter-application-manager.tsx");

  assert.ok(fs.existsSync(appsPage), "Recruiter applications page exists");
  assert.ok(fs.existsSync(shortlistedPage), "Recruiter shortlisted page exists");
  assert.ok(fs.existsSync(managerComp), "Recruiter application manager component exists");

  const managerContent = fs.readFileSync(managerComp, "utf-8");
  assert.ok(managerContent.includes("updateApplicationStatus"), "Manager component calls server status update");
  assert.ok(managerContent.includes("filterShortlistedOnly"), "Manager supports pipeline-only filtering");
});

// -----------------------------------------------------------------------------
// Test 5: Recruiter Salary Analytics Page
// -----------------------------------------------------------------------------
runTest("Salary Analytics: Benchmarks, compensation ranges, and recruitment funnel", () => {
  const analyticsPage = path.join(rootDir, "src/app/recruiter/analytics/page.tsx");
  assert.ok(fs.existsSync(analyticsPage), "Recruiter analytics page exists");

  const content = fs.readFileSync(analyticsPage, "utf-8");
  assert.ok(content.includes("avgSalary"), "Computes average salary");
  assert.ok(content.includes("medianSalary"), "Computes median salary offer");
  assert.ok(content.includes("workModeCounts"), "Analyzes work mode distribution");
  assert.ok(content.includes("appsPerOpening"), "Computes applicant yield per opening");
});

// -----------------------------------------------------------------------------
// Test 6: External Job Search Service & Student Job Discovery
// -----------------------------------------------------------------------------
runTest("External Jobs & Live Vacancies: Service provider abstraction & student discovery tabs", () => {
  const serviceFile = path.join(rootDir, "src/lib/services/external-jobs.ts");
  assert.ok(fs.existsSync(serviceFile), "External jobs service exists");

  const serviceContent = fs.readFileSync(serviceFile, "utf-8");
  assert.ok(serviceContent.includes("searchExternalJobs"), "Exports searchExternalJobs function");
  assert.ok(serviceContent.includes("CURATED_LIVE_TECH_JOBS"), "Provides resilient curated fallback vacancies");

  const jobsPage = fs.readFileSync(path.join(rootDir, "src/app/jobs/page.tsx"), "utf-8");
  assert.ok(jobsPage.includes("searchExternalJobs"), "Jobs page queries external vacancies");
  assert.ok(jobsPage.includes("currentTab"), "Jobs page supports tab toggle between campus and external");
});

// -----------------------------------------------------------------------------
// Test 7: Student Dashboard Recommended Vacancies
// -----------------------------------------------------------------------------
runTest("Student Dashboard: Displays recommended live vacancies and tracking prompts", () => {
  const dashFile = fs.readFileSync(path.join(rootDir, "src/app/dashboard/page.tsx"), "utf-8");
  assert.ok(dashFile.includes("recommendedJobs"), "Student dashboard fetches recommended vacancies");
  assert.ok(dashFile.includes("Recommended Live Tech Opportunities"), "Renders recommended vacancies section");
});

console.log("\n------------------------------------------------------------------");
console.log(` Summary: ${passed} Passed, ${failed} Failed`);
console.log("==================================================================\n");

if (failed > 0) {
  process.exit(1);
}
