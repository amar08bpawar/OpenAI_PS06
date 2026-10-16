"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  startAptitudeTestAction,
  submitAptitudeTestAction,
} from "@/app/actions/aptitude";
import type {
  AptitudeCategory,
  AptitudeDifficulty,
  AptitudeTest,
  PublicAptitudeQuestion,
} from "@/types/database";
import type { GradedResult } from "@/lib/services/aptitude";
import {
  Brain,
  Calculator,
  Binary,
  BookText,
  Lightbulb,
  Cpu,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  History,
  Play,
  Loader2,
  Award,
} from "lucide-react";

interface Props {
  initialAttempts: any[];
}

const CATEGORIES: {
  id: AptitudeCategory;
  name: string;
  icon: any;
  description: string;
}[] = [
  {
    id: "logical",
    name: "Logical Reasoning",
    icon: Brain,
    description: "Series completion, syllogisms, blood relations, and pattern deduction.",
  },
  {
    id: "quantitative",
    name: "Quantitative Aptitude",
    icon: Calculator,
    description: "Time & work, speed & distance, percentages, ratios, and averages.",
  },
  {
    id: "mathematics",
    name: "Applied Mathematics",
    icon: Binary,
    description: "Algebra, calculus fundamentals, matrices, geometry, and probability.",
  },
  {
    id: "verbal",
    name: "Verbal Ability & Grammar",
    icon: BookText,
    description: "Vocabulary, reading comprehension, idioms, and sentence correction.",
  },
  {
    id: "problem_solving",
    name: "Analytical Problem Solving",
    icon: Lightbulb,
    description: "Puzzles, brainteasers, critical thinking, and algorithmic deductions.",
  },
  {
    id: "technical",
    name: "Core Technical Concepts",
    icon: Cpu,
    description: "Data structures, algorithms, databases, OS, and software engineering.",
  },
];

export function AptitudeClientView({ initialAttempts }: Props) {
  // Mode: "setup" | "exam" | "result"
  const [viewMode, setViewMode] = useState<"setup" | "exam" | "result">("setup");
  const [attempts, setAttempts] = useState<any[]>(initialAttempts);

  // Setup form
  const [selectedCategory, setSelectedCategory] = useState<AptitudeCategory>("logical");
  const [selectedDifficulty, setSelectedDifficulty] = useState<AptitudeDifficulty>("intermediate");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active exam state
  const [activeTest, setActiveTest] = useState<AptitudeTest | null>(null);
  const [questions, setQuestions] = useState<PublicAptitudeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Result state
  const [gradedResult, setGradedResult] = useState<GradedResult | null>(null);

  // Start exam handler
  const handleStartExam = async () => {
    setStarting(true);
    setError(null);

    try {
      const res = await startAptitudeTestAction({
        category: selectedCategory,
        difficulty: selectedDifficulty,
        questionCount,
      });

      if (res.success && res.data) {
        setActiveTest(res.data.test);
        setQuestions(res.data.questions);
        setCurrentIndex(0);
        setUserAnswers({});
        setSecondsRemaining(res.data.test.time_limit_minutes * 60);
        setViewMode("exam");
      } else {
        setError(res.error || "Failed to start assessment.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to launch test session.");
    } finally {
      setStarting(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (viewMode !== "exam") return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Auto submit when time runs out
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewMode]);

  // Answer selection
  const handleSelectOption = (optionIndex: number) => {
    const q = questions[currentIndex];
    if (!q) return;
    setUserAnswers((prev) => ({
      ...prev,
      [q.id]: optionIndex,
    }));
  };

  // Submit test
  const handleFinalSubmit = async () => {
    if (!activeTest || submitting) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSubmitting(true);
    setError(null);

    const totalTime = activeTest.time_limit_minutes * 60;
    const timeSpent = Math.max(totalTime - secondsRemaining, 1);

    try {
      const res = await submitAptitudeTestAction({
        testId: activeTest.id,
        userAnswers,
        timeSpentSeconds: timeSpent,
      });

      if (res.success && res.result) {
        setGradedResult(res.result);
        setViewMode("result");

        // Prepend to attempts table
        const newAttemptItem = {
          id: `local-${Date.now()}`,
          score: res.result.score,
          total_questions: res.result.totalQuestions,
          correct_count: res.result.correctCount,
          time_spent_seconds: res.result.timeSpentSeconds,
          passed: res.result.passed,
          created_at: new Date().toISOString(),
          test: {
            id: activeTest.id,
            title: activeTest.title,
            category: activeTest.category,
            difficulty: activeTest.difficulty,
          },
        };
        setAttempts((prev) => [newAttemptItem, ...prev]);
      } else {
        setError(res.error || "Grading submission failed.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to grade answers.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ---------------------------------------------------------------------------
  // VIEW: Active Exam
  // ---------------------------------------------------------------------------
  if (viewMode === "exam" && activeTest) {
    const currentQ = questions[currentIndex];
    const selectedOpt = currentQ ? userAnswers[currentQ.id] : undefined;
    const answeredCount = Object.keys(userAnswers).length;

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Sticky Header with Timer & Progress */}
        <div className="sticky top-20 z-10 bg-background/95 backdrop-blur border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">{activeTest.title}</h2>
            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>•</span>
              <span className="text-primary font-medium">{answeredCount} answered</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm border ${
                secondsRemaining < 120
                  ? "bg-rose-500/10 text-rose-600 border-rose-500/30 animate-pulse"
                  : "bg-muted text-foreground border-border"
              }`}
            >
              <Clock className="h-4 w-4" />
              {formatTimer(secondsRemaining)}
            </div>

            <Button
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Grading...
                </>
              ) : (
                "Finish & Grade"
              )}
            </Button>
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs uppercase font-mono">
                  Q {currentIndex + 1}
                </Badge>
                {selectedOpt !== undefined && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Answered
                  </span>
                )}
              </div>
              <CardTitle className="text-lg font-medium leading-relaxed mt-2">
                {currentQ.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQ.options.map((optionText, optIdx) => {
                const isSelected = selectedOpt === optIdx;
                const letter = String.fromCharCode(65 + optIdx);
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-start gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary"
                        : "border-border hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <span
                      className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="pt-0.5">{optionText}</span>
                  </button>
                );
              })}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t border-border pt-4">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
              >
                Previous
              </Button>

              {/* Question Navigation Bubbles */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[240px] px-2">
                {questions.map((q, idx) => {
                  const isCur = idx === currentIndex;
                  const isAns = userAnswers[q.id] !== undefined;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-7 w-7 rounded-md text-xs font-medium transition-colors ${
                        isCur
                          ? "bg-primary text-primary-foreground"
                          : isAns
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {currentIndex < questions.length - 1 ? (
                <Button onClick={() => setCurrentIndex((prev) => prev + 1)}>
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Submit Test
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: Graded Results & Explanations
  // ---------------------------------------------------------------------------
  if (viewMode === "result" && gradedResult) {
    const passingThreshold = 60;
    const isPass = gradedResult.passed;

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Result Hero Card */}
        <Card className={isPass ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}>
          <CardContent className="pt-6 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-background border border-border shadow-sm">
              <Award className={`h-8 w-8 ${isPass ? "text-emerald-500" : "text-rose-500"}`} />
            </div>
            <div>
              <Badge
                variant="outline"
                className={`text-sm px-3 py-1 font-semibold uppercase ${
                  isPass
                    ? "border-emerald-500 text-emerald-600 bg-emerald-500/10"
                    : "border-rose-500 text-rose-600 bg-rose-500/10"
                }`}
              >
                {isPass ? "Assessment Passed" : "Assessment Not Cleared"}
              </Badge>
              <div className="text-4xl font-extrabold mt-2 tracking-tight">
                {gradedResult.score}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                You correctly answered {gradedResult.correctCount} out of {gradedResult.totalQuestions} questions in{" "}
                {Math.round(gradedResult.timeSpentSeconds / 60)}m {gradedResult.timeSpentSeconds % 60}s.
                (Passing threshold: {passingThreshold}%).
              </p>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <Button onClick={() => setViewMode("setup")} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Take Another Test
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Question Explanations */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Answer Explanations & Step-by-Step Breakdown</h3>

          {gradedResult.breakdown.map((item, idx) => (
            <Card key={item.questionId} className={`border ${item.isCorrect ? "border-emerald-500/20" : "border-rose-500/20"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs">
                    Question {idx + 1}
                  </Badge>
                  {item.isCorrect ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Correct (+1)
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Incorrect (0)
                    </span>
                  )}
                </div>
                <CardTitle className="text-base font-medium mt-1">
                  {item.questionText}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {item.options.map((opt, optIdx) => {
                    const isUserAns = item.userAnswer === optIdx;
                    const isCorrectOpt = item.correctOption === optIdx;
                    const letter = String.fromCharCode(65 + optIdx);

                    let style = "border-border bg-card text-muted-foreground";
                    if (isCorrectOpt) {
                      style = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500";
                    } else if (isUserAns && !isCorrectOpt) {
                      style = "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 line-through";
                    }

                    return (
                      <div key={optIdx} className={`p-2.5 rounded-lg border flex items-center gap-2 ${style}`}>
                        <span className="font-bold">{letter}.</span>
                        <span>{opt}</span>
                        {isCorrectOpt && <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-emerald-600" />}
                        {isUserAns && !isCorrectOpt && <XCircle className="h-3.5 w-3.5 ml-auto text-rose-600" />}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1 border border-border/60 mt-3">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-primary" /> Rationale & Explanation:
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: Setup & Assessment Config
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* Test Launch Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configure Assessment</CardTitle>
          <CardDescription>
            Choose your focus category, difficulty tier, and question count to launch a timed placement test.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category Selection Grid */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
              1. Assessment Domain
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSel = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSel
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-lg ${
                            isSel ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <h4 className="font-semibold text-sm">{cat.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty & Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                2. Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["beginner", "intermediate", "advanced"] as AptitudeDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition-colors ${
                      selectedDifficulty === diff
                        ? "border-primary bg-primary text-primary-foreground font-semibold"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                3. Number of Questions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      questionCount === cnt
                        ? "border-primary bg-primary text-primary-foreground font-semibold"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    {cnt} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="border-t border-border pt-4">
          <Button
            size="lg"
            onClick={handleStartExam}
            disabled={starting}
            className="w-full sm:w-auto gap-2 bg-primary font-semibold"
          >
            {starting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assembling Assessment...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Launch Assessment
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Attempt History Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Past Attempt History
          </CardTitle>
          <CardDescription>
            Review previous test performances, scores, and timestamps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No tests attempted yet. Launch an assessment above to record your first score!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">Assessment Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Difficulty</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {attempts.map((att) => (
                    <tr key={att.id} className="hover:bg-muted/30">
                      <td className="py-3 px-3 font-medium text-foreground">
                        {att.test?.title || "Aptitude Assessment"}
                      </td>
                      <td className="py-3 px-3 capitalize text-muted-foreground">
                        {att.test?.category || "logical"}
                      </td>
                      <td className="py-3 px-3 capitalize text-muted-foreground">
                        {att.test?.difficulty || "standard"}
                      </td>
                      <td className="py-3 px-3 font-bold font-mono">
                        {att.score}% ({att.correct_count}/{att.total_questions})
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant="outline"
                          className={
                            att.passed
                              ? "border-emerald-500 text-emerald-600 bg-emerald-500/10 text-[10px]"
                              : "border-rose-500 text-rose-600 bg-rose-500/10 text-[10px]"
                          }
                        >
                          {att.passed ? "Passed" : "Not Cleared"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {new Date(att.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
