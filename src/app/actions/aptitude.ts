"use server";

import { createClient } from "@/lib/supabase/server";
import {
  generateAptitudeQuestions,
  sanitizeQuestionsForClient,
  gradeTestAnswers,
  type GradedResult,
} from "@/lib/services/aptitude";
import type {
  AptitudeCategory,
  AptitudeDifficulty,
  AptitudeTest,
  PublicAptitudeQuestion,
} from "@/types/database";

export interface AptitudeTestSession {
  test: AptitudeTest;
  questions: PublicAptitudeQuestion[];
}

export async function startAptitudeTestAction(params: {
  category: AptitudeCategory;
  difficulty: AptitudeDifficulty;
  questionCount?: number;
}): Promise<{
  success: boolean;
  data?: AptitudeTestSession;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required to start an aptitude test." };
  }

  const count = Math.min(Math.max(params.questionCount || 5, 3), 15);
  const timeLimit = Math.max(Math.round(count * 1.5), 5); // 1.5 mins per question

  // 1. Generate questions server-side
  const { questions: generatedQuestions, isFallback } = await generateAptitudeQuestions(
    params.category,
    params.difficulty,
    count
  );

  if (!generatedQuestions || generatedQuestions.length === 0) {
    return { success: false, error: "Failed to assemble test questions." };
  }

  // 2. Insert test into database
  const categoryTitles: Record<AptitudeCategory, string> = {
    logical: "Logical Reasoning Assessment",
    quantitative: "Quantitative Aptitude Exam",
    mathematics: "Applied Mathematics Test",
    verbal: "Verbal Ability & Grammar Evaluation",
    problem_solving: "Analytical Problem Solving",
    technical: "Core Technical Concepts Exam",
  };

  const { data: testRecord, error: testError } = await supabase
    .from("aptitude_tests")
    .insert({
      title: `${categoryTitles[params.category]} (${params.difficulty.toUpperCase()})`,
      category: params.category,
      difficulty: params.difficulty,
      description: `Timed assessment comprising ${count} multiple-choice questions. Passing threshold: 60%.`,
      time_limit_minutes: timeLimit,
      total_questions: count,
      is_generated: !isFallback,
    })
    .select()
    .single();

  if (testError || !testRecord) {
    return { success: false, error: testError?.message || "Failed to create test record." };
  }

  // 3. Insert questions with answer keys on the server
  const questionInserts = generatedQuestions.map((q, idx) => ({
    test_id: testRecord.id,
    question_text: q.question_text,
    options: q.options as any,
    correct_option: q.correct_option,
    explanation: q.explanation,
    order_index: idx + 1,
  }));

  const { data: insertedQuestions, error: qError } = await supabase
    .from("aptitude_questions")
    .insert(questionInserts)
    .select();

  if (qError || !insertedQuestions) {
    return { success: false, error: qError?.message || "Failed to save questions." };
  }

  // 4. SANITIZE for client: answer keys and explanations STRIPPED!
  const publicQuestions = sanitizeQuestionsForClient(insertedQuestions as any);

  return {
    success: true,
    data: {
      test: testRecord,
      questions: publicQuestions,
    },
  };
}

export async function submitAptitudeTestAction(params: {
  testId: string;
  userAnswers: Record<string, number>;
  timeSpentSeconds: number;
}): Promise<{
  success: boolean;
  result?: GradedResult;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required to submit test." };
  }

  // 1. Fetch server-side questions with correct_option
  const { data: questions, error: qError } = await supabase
    .from("aptitude_questions")
    .select("*")
    .eq("test_id", params.testId)
    .order("order_index", { ascending: true });

  if (qError || !questions || questions.length === 0) {
    return { success: false, error: "Unable to locate test questions for grading." };
  }

  // 2. Grade deterministically on the server
  const graded = gradeTestAnswers(
    questions as any,
    params.userAnswers,
    params.timeSpentSeconds
  );

  // 3. Save attempt record with student ownership
  const { error: attemptError } = await supabase.from("aptitude_attempts").insert({
    student_id: user.id,
    test_id: params.testId,
    score: graded.score,
    total_questions: graded.totalQuestions,
    correct_count: graded.correctCount,
    time_spent_seconds: graded.timeSpentSeconds,
    user_answers: params.userAnswers as any,
    passed: graded.passed,
  });

  if (attemptError) {
    // Return graded output even if attempt logging fails
    console.error("Failed to save test attempt:", attemptError.message);
  }

  return {
    success: true,
    result: graded,
  };
}

export async function getStudentAptitudeHistoryAction(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data, error } = await supabase
    .from("aptitude_attempts")
    .select(`
      id,
      score,
      total_questions,
      correct_count,
      time_spent_seconds,
      passed,
      created_at,
      test:test_id (
        id,
        title,
        category,
        difficulty
      )
    `)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data || [] };
}
