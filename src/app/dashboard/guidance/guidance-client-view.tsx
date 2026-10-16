"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateCareerGuidanceAction } from "@/app/actions/guidance";
import type { CareerGuidanceAnalysis, StudentDetails, Profile } from "@/types/database";
import {
  Compass,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Milestone,
  ArrowRight,
  Loader2,
  GraduationCap,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

interface Props {
  profile: Profile | null;
  details: Partial<StudentDetails> | null;
  savedReport?: any;
}

const COMMON_ROLES = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Software Engineer",
  "Data Analyst",
  "Cloud / DevOps Engineer",
  "Machine Learning Engineer",
];

export function GuidanceClientView({ profile, details, savedReport }: Props) {
  const [targetRole, setTargetRole] = useState(savedReport?.target_role || "Full Stack Developer");
  const [customRole, setCustomRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CareerGuidanceAnalysis | null>(
    savedReport ? (savedReport.analysis as CareerGuidanceAnalysis) : null
  );

  const activeRole = customRole.trim() || targetRole;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await generateCareerGuidanceAction(activeRole);
      if (res.success && res.data) {
        setAnalysis(res.data);
      } else {
        setError(res.error || "Failed to generate career guidance.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to generate roadmap.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Role Selector Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" /> Target Career Pathway
          </CardTitle>
          <CardDescription>
            Select your desired campus placement role to benchmark your current profile and pinpoint skill gaps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {COMMON_ROLES.map((role) => (
              <Button
                key={role}
                type="button"
                variant={targetRole === role && !customRole ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTargetRole(role);
                  setCustomRole("");
                }}
              >
                {role}
              </Button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Input
              placeholder="Or enter custom role (e.g., iOS Mobile Developer)..."
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="max-w-md text-sm"
            />
            <Button onClick={handleGenerate} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing Profile & Market Demands...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Readiness & Generate Roadmap
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results View */}
      {analysis && (
        <div className="space-y-6">
          {/* Data Insufficiency Alert if applicable */}
          {!analysis.is_data_sufficient && (
            <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="font-semibold text-xs uppercase tracking-wide">
                Insufficient Profile Information
              </AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <p>
                  {analysis.insufficient_reason ||
                    "Your profile lacks technical skills, degree details, or projects."}
                </p>
                <div className="pt-1">
                  <Link
                    href="/dashboard/profile"
                    className="text-primary underline font-medium hover:text-primary/80"
                  >
                    Click here to update your profile & add your skills →
                  </Link>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Hero Readiness Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 flex flex-col justify-between border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Readiness Diagnostic
                </CardTitle>
                <div className="text-4xl font-extrabold text-primary tracking-tight mt-1">
                  {analysis.readiness_score}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated suitability for <strong>{activeRole}</strong> placement drives based on
                  recorded criteria.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${analysis.readiness_score}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Strategic Placement Advice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground">
                  {analysis.advice}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Skill Gap Analysis Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Skills */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" /> Skills Matched ({analysis.skills_matched.length})
                </CardTitle>
                <CardDescription>
                  Prerequisites in your profile matching {activeRole} requirements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.skills_matched.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No overlapping skills detected yet. Complete profile courses and project tags to match.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills_matched.map((skill) => (
                      <Badge
                        key={skill}
                        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                      >
                        ✓ {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills Gap */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" /> Skill Gaps to Bridge ({analysis.skills_gap.length})
                </CardTitle>
                <CardDescription>
                  High-priority industry skills missing from your profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.skills_gap.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-medium">
                    Excellent! All standard benchmark skills for this role are represented in your profile.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills_gap.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-500/5"
                      >
                        + {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Targeted Actionable Learning Plan */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Recommended Learning Plan
              </CardTitle>
              <CardDescription>
                Targeted actions to master critical competencies for {activeRole}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.recommended_learning_plan.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border bg-card space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-semibold text-sm text-primary flex items-center gap-1.5">
                        <ArrowRight className="h-4 w-4" /> {item.skill}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {item.action}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Curated Resources:
                      </span>
                      <ul className="text-[11px] space-y-0.5 text-muted-foreground list-disc list-inside">
                        {item.resources.map((res, rIdx) => (
                          <li key={rIdx}>{res}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline Milestones */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Milestone className="h-5 w-5 text-primary" /> Placement Preparation Milestones
              </CardTitle>
              <CardDescription>
                Chronological execution strategy for campus hiring drives.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.milestones.map((milestone, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/60 text-xs"
                  >
                    <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shrink-0 text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5 text-foreground leading-relaxed">{milestone}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
