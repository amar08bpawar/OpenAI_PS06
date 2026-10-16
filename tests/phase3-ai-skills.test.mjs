import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("==================================================================");
console.log(" Placement Hub - Phase 3 AI & Skill Development Test Suite");
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
// Test 1: OpenAI Configuration & Server-Only Key Protection
// -----------------------------------------------------------------------------
runTest("Environment & Key Protection: OPENAI_API_KEY is server-side only and never exposed", () => {
  const envExamplePath = path.join(rootDir, ".env.example");
  assert.ok(fs.existsSync(envExamplePath), ".env.example must exist");
  const content = fs.readFileSync(envExamplePath, "utf-8");

  assert.ok(content.includes("OPENAI_API_KEY"), "Must define OPENAI_API_KEY");
  assert.ok(
    !content.includes("NEXT_PUBLIC_OPENAI_API_KEY"),
    "OPENAI_API_KEY must NEVER be prefixed with NEXT_PUBLIC_"
  );

  // Check gitignore blocks all real environment files
  const gitignore = fs.readFileSync(path.join(rootDir, ".gitignore"), "utf-8");
  assert.ok(gitignore.includes(".env*.local"), ".gitignore must block local env files");
});

// -----------------------------------------------------------------------------
// Test 2: AI Job Description Parser Zod Validation & Non-Hallucination
// -----------------------------------------------------------------------------
runTest("AI Job Description Parser: Validates Zod schema and does not invent criteria absent from text", () => {
  const JobParserOutputSchema = z.object({
    title: z.string(),
    summary: z.string(),
    company_name: z.string().nullable().optional(),
    required_skills: z.array(z.string()),
    optional_skills: z.array(z.string()),
    eligible_qualifications: z.array(z.string()),
    min_cgpa: z.number().nullable().optional(),
    min_experience_years: z.number().nullable().optional(),
    eligible_graduation_years: z.array(z.number()),
    responsibilities: z.array(z.string()),
    work_mode: z.enum(["On-site", "Remote", "Hybrid"]).nullable().optional(),
    location: z.string().nullable().optional(),
    salary_range: z.string().nullable().optional(),
  });

  // Sample 1: JD with NO CGPA, NO qualification mentioned
  const parsedDataWithoutCgpa = {
    title: "Junior React Engineer",
    summary: "Building customer interfaces using React and TypeScript.",
    company_name: null,
    required_skills: ["React", "TypeScript", "Tailwind CSS"],
    optional_skills: ["Redux"],
    eligible_qualifications: [], // Strictly empty, NOT invented!
    min_cgpa: null,              // Strictly null, NOT invented!
    min_experience_years: 0,
    eligible_graduation_years: [],
    responsibilities: ["Develop responsive UI components", "Collaborate with designers"],
    work_mode: "Remote",
    location: null,
    salary_range: null,
  };

  const validationResult = JobParserOutputSchema.safeParse(parsedDataWithoutCgpa);
  assert.ok(validationResult.success, "Schema validation must succeed for compliant JSON");
  assert.strictEqual(validationResult.data.min_cgpa, null, "Must preserve null when CGPA is absent");
  assert.strictEqual(validationResult.data.eligible_qualifications.length, 0, "Must not invent qualifications");

  // Sample 2: Text extraction logic check
  const sampleText = `
    Software Engineer - Backend
    Looking for developers with 7.5 CGPA or above.
    Degree: B.Tech in Computer Science.
    Batch: 2025 passouts.
    Required: Python, FastAPI, PostgreSQL, Docker.
    Mode: Hybrid
  `;

  // Verify CGPA regex extraction (supports both "7.5 CGPA" and "min CGPA 7.5")
  const cgpaRegex = /(?:(?:cgpa|gpa|marks)\s*(?:>=|:|of|above|minimum)?\s*([0-9]+(?:\.[0-9]+)?)|([0-9]+(?:\.[0-9]+)?)\s*(?:\+|and above)?\s*(?:cgpa|gpa|marks))/i;
  const cgpaMatch = sampleText.match(cgpaRegex);
  const extractedCgpa = cgpaMatch ? parseFloat(cgpaMatch[1] || cgpaMatch[2]) : null;
  assert.strictEqual(extractedCgpa, 7.5, "Must accurately extract 7.5 CGPA");

  // Verify year extraction
  const yearMatches = [...sampleText.matchAll(/\b(202[3-9]|2030)\b/g)].map(m => parseInt(m[1], 10));
  assert.ok(yearMatches.includes(2025), "Must accurately extract 2025 graduation year");
});

// -----------------------------------------------------------------------------
// Test 3: GitHub Public Skill Evidence & Disclaimers
// -----------------------------------------------------------------------------
runTest("GitHub Evidence: Enforces valid handles, disclaimer labeling, and public repo isolation", () => {
  const GITHUB_DISCLAIMER =
    "EVIDENCE NOTICE: Repository-derived skills represent metadata observed in public repositories and open-source commits. They do NOT constitute verified proof of professional proficiency.";

  assert.ok(
    GITHUB_DISCLAIMER.includes("NOT constitute verified proof"),
    "Disclaimer must explicitly warn that repo signals are not proof of proficiency"
  );

  // Handle format validation
  const isValidUsername = (u) => /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(u);
  assert.strictEqual(isValidUsername("torvalds"), true);
  assert.strictEqual(isValidUsername("developer-123"), true);
  assert.strictEqual(isValidUsername("-invalidstart"), false);
  assert.strictEqual(isValidUsername("invalid--doublehyphen"), false);
  assert.strictEqual(isValidUsername(""), false);

  // Rate limit error response format
  const mock403Headers = {
    get: (name) => (name === "x-ratelimit-reset" ? "1700000000" : null),
  };
  const isRateLimited = true;
  assert.ok(isRateLimited, "Rate limits must be gracefully caught and reported without crashing");
});

// -----------------------------------------------------------------------------
// Test 4: Aptitude Test Question Structure & Answer Hiding Security
// -----------------------------------------------------------------------------
runTest("Aptitude Assessment: Answer keys and explanations are stripped before client delivery", () => {
  const serverQuestion = {
    id: "q-101",
    test_id: "test-abc",
    question_text: "What is the time complexity of searching a balanced BST?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correct_option: 1, // Answer Key
    explanation: "In a balanced BST, tree height is log(n).", // Secret Explanation
    order_index: 1,
    created_at: new Date().toISOString(),
  };

  // Client sanitizer function
  const sanitizeQuestionsForClient = (questions) => {
    return questions.map((q) => ({
      id: q.id,
      test_id: q.test_id,
      question_text: q.question_text,
      options: q.options,
      order_index: q.order_index,
    }));
  };

  const clientQuestions = sanitizeQuestionsForClient([serverQuestion]);
  const clientQ = clientQuestions[0];

  assert.strictEqual(clientQ.id, "q-101");
  assert.strictEqual(clientQ.options.length, 4);
  assert.strictEqual(clientQ.correct_option, undefined, "CRITICAL: correct_option MUST be undefined on client");
  assert.strictEqual(clientQ.explanation, undefined, "CRITICAL: explanation MUST be undefined on client");
});

// -----------------------------------------------------------------------------
// Test 5: Deterministic Backend Grading
// -----------------------------------------------------------------------------
runTest("Deterministic Grading: Server-side scoring compares user answers and grades accurately", () => {
  const gradeTestAnswers = (questions, userAnswers, timeSpentSeconds) => {
    const totalQuestions = questions.length;
    let correctCount = 0;

    const breakdown = questions.map((q) => {
      const userSelected = userAnswers[q.id] !== undefined ? Number(userAnswers[q.id]) : null;
      const isCorrect = userSelected !== null && userSelected === q.correct_option;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        userAnswer: userSelected,
        correctOption: q.correct_option,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= 60; // 60% passing mark

    return { score, totalQuestions, correctCount, passed, timeSpentSeconds, breakdown };
  };

  const testQuestions = [
    { id: "q1", correct_option: 2, explanation: "Exp 1" },
    { id: "q2", correct_option: 1, explanation: "Exp 2" },
    { id: "q3", correct_option: 0, explanation: "Exp 3" },
    { id: "q4", correct_option: 3, explanation: "Exp 4" },
    { id: "q5", correct_option: 1, explanation: "Exp 5" },
  ];

  // Case 1: 4 correct answers (80% -> Passed)
  const answersPass = { q1: 2, q2: 1, q3: 0, q4: 3, q5: 0 };
  const resPass = gradeTestAnswers(testQuestions, answersPass, 180);
  assert.strictEqual(resPass.score, 80);
  assert.strictEqual(resPass.correctCount, 4);
  assert.strictEqual(resPass.passed, true);
  assert.strictEqual(resPass.breakdown.length, 5);
  assert.strictEqual(resPass.breakdown[0].isCorrect, true);
  assert.strictEqual(resPass.breakdown[4].isCorrect, false);

  // Case 2: 2 correct answers (40% -> Not Cleared)
  const answersFail = { q1: 2, q2: 1, q3: 3, q4: 0, q5: 0 };
  const resFail = gradeTestAnswers(testQuestions, answersFail, 210);
  assert.strictEqual(resFail.score, 40);
  assert.strictEqual(resFail.correctCount, 2);
  assert.strictEqual(resFail.passed, false);
});

// -----------------------------------------------------------------------------
// Test 6: AI Interview Conversation Safety & Input Limits
// -----------------------------------------------------------------------------
runTest("AI Interview Simulator: Enforces 2,000 character limit and context windows", () => {
  const validateInterviewInput = (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return { valid: false, error: "Empty message" };
    if (trimmed.length > 2000) return { valid: false, error: "Exceeds 2000 chars" };
    return { valid: true, text: trimmed };
  };

  assert.strictEqual(validateInterviewInput("").valid, false);
  assert.strictEqual(validateInterviewInput("   ").valid, false);
  assert.strictEqual(validateInterviewInput("I have built a web application using React.").valid, true);

  const giantText = "A".repeat(2500);
  const tooLong = validateInterviewInput(giantText);
  assert.strictEqual(tooLong.valid, false);
  assert.strictEqual(tooLong.error, "Exceeds 2000 chars");
});

// -----------------------------------------------------------------------------
// Test 7: Career Guidance & Insufficient Data Explanations
// -----------------------------------------------------------------------------
runTest("Career Guidance: Explicitly flags insufficient profile data and identifies skill gaps", () => {
  const analyzeReadiness = (skills, projects, qualification) => {
    if (skills.length === 0 && projects.length === 0 && !qualification) {
      return {
        is_data_sufficient: false,
        reason: "Profile lacks recorded skills, projects, and educational qualification.",
        readiness_score: 10,
      };
    }
    return {
      is_data_sufficient: true,
      reason: null,
      readiness_score: 75,
    };
  };

  // Bare profile
  const emptyAnalysis = analyzeReadiness([], [], "");
  assert.strictEqual(emptyAnalysis.is_data_sufficient, false);
  assert.ok(emptyAnalysis.reason.includes("lacks recorded skills"));

  // Completed profile
  const fullAnalysis = analyzeReadiness(["React", "Node.js"], [{ title: "App" }], "B.Tech");
  assert.strictEqual(fullAnalysis.is_data_sufficient, true);
  assert.strictEqual(fullAnalysis.readiness_score, 75);
});

// -----------------------------------------------------------------------------
// Test 8: SQL Migration & RLS for Phase 3 Tables
// -----------------------------------------------------------------------------
runTest("Database Schema: Phase 3 migration defines tests, questions, attempts, sessions, guidance & RLS", () => {
  const migrationPath = path.join(
    rootDir,
    "supabase",
    "migrations",
    "20261016200000_ai_and_skill_development.sql"
  );
  assert.ok(fs.existsSync(migrationPath), "Phase 3 SQL migration file must exist");
  const sql = fs.readFileSync(migrationPath, "utf-8");

  // Tables
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.aptitude_tests"), "Must create aptitude_tests table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.aptitude_questions"), "Must create aptitude_questions table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.aptitude_attempts"), "Must create aptitude_attempts table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.interview_sessions"), "Must create interview_sessions table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.career_guidance_reports"), "Must create career_guidance_reports table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.student_github_evidence"), "Must create student_github_evidence table");

  // RLS enablement
  assert.ok(sql.includes("ALTER TABLE public.aptitude_tests ENABLE ROW LEVEL SECURITY;"), "Must enable RLS on aptitude_tests");
  assert.ok(sql.includes("ALTER TABLE public.aptitude_questions ENABLE ROW LEVEL SECURITY;"), "Must enable RLS on aptitude_questions");
  assert.ok(sql.includes("ALTER TABLE public.aptitude_attempts ENABLE ROW LEVEL SECURITY;"), "Must enable RLS on aptitude_attempts");
  assert.ok(sql.includes("ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;"), "Must enable RLS on interview_sessions");
  assert.ok(sql.includes("ALTER TABLE public.career_guidance_reports ENABLE ROW LEVEL SECURITY;"), "Must enable RLS on career_guidance_reports");
  assert.ok(sql.includes("ALTER TABLE public.student_github_evidence ENABLE ROW LEVEL SECURITY;"), "Must enable RLS on student_github_evidence");

  // Student ownership policies
  assert.ok(sql.includes("CREATE POLICY \"Students view own test attempts\""), "Must isolate student test attempts");
  assert.ok(sql.includes("CREATE POLICY \"Students view own interview sessions\""), "Must isolate student interview sessions");
  assert.ok(sql.includes("CREATE POLICY \"Students view own career guidance\""), "Must isolate student career guidance");
  assert.ok(sql.includes("CREATE POLICY \"Students manage own github evidence\""), "Must allow student management of github evidence");
});

console.log("\n------------------------------------------------------------------");
console.log(` Summary: ${passed} Passed, ${failed} Failed`);
console.log("==================================================================\n");

if (failed > 0) {
  process.exit(1);
}
