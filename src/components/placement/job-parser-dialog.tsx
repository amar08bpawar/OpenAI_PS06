"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { parseJobDescriptionAction } from "@/app/actions/ai-job-parser";
import type { JobParserOutput } from "@/lib/services/job-parser";
import { Sparkles, Loader2, CheckCircle2, ShieldAlert, ArrowRight, Copy } from "lucide-react";

interface Props {
  onApply: (data: JobParserOutput) => void;
}

export function JobParserDialog({ onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<JobParserOutput | null>(null);

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setParsing(true);
    setError(null);

    try {
      const res = await parseJobDescriptionAction(rawText);
      if (res.success && res.data) {
        setParsedResult(res.data);
      } else {
        setError(res.error || "Failed to extract job parameters.");
      }
    } catch (err: any) {
      setError(err?.message || "Parsing error occurred.");
    } finally {
      setParsing(false);
    }
  };

  const handleApplyToForm = () => {
    if (!parsedResult) return;
    onApply(parsedResult);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 border-primary/40 text-primary hover:bg-primary/5"
        >
          <Sparkles className="h-4 w-4 text-primary" /> Auto-Fill via AI Parser
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" /> AI Job Description Parser
          </DialogTitle>
          <DialogDescription>
            Paste unstructured job text. OpenAI gpt-4o-mini extracts normalized technical skills,
            qualifications, responsibilities, and criteria. Review before applying.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Step 1: Input text */}
          {!parsedResult ? (
            <div className="space-y-3">
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste complete job description, hiring email, or announcement here (e.g. 'We are hiring a Full Stack React/Node Developer. Must have 7.5 CGPA, B.Tech CSE, 2025 batch...')."
                className="w-full rounded-xl border border-input bg-background p-3.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="button"
                onClick={handleParse}
                disabled={parsing || !rawText.trim()}
                className="w-full gap-2"
              >
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting & Validating Requirements...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extract Structured Criteria
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Step 2: User Review of Extracted Information */
            <div className="space-y-4">
              <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 py-2.5">
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-xs font-semibold uppercase tracking-wider">
                  Mandatory Recruiter Review
                </AlertTitle>
                <AlertDescription className="text-xs">
                  Criteria absent from the original text were not invented. Verify the extracted fields below before applying to your listing.
                </AlertDescription>
              </Alert>

              <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/30 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px] uppercase">
                    Extracted Job Title
                  </span>
                  <p className="font-bold text-sm text-foreground mt-0.5">{parsedResult.title}</p>
                </div>

                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px] uppercase">
                    Role Summary
                  </span>
                  <p className="text-muted-foreground mt-0.5">{parsedResult.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50">
                  <div>
                    <span className="font-semibold text-muted-foreground block text-[11px] uppercase">
                      Min CGPA
                    </span>
                    <p className="font-mono font-medium mt-0.5">
                      {parsedResult.min_cgpa !== null && parsedResult.min_cgpa !== undefined
                        ? parsedResult.min_cgpa
                        : "None specified in text"}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block text-[11px] uppercase">
                      Work Mode
                    </span>
                    <p className="font-medium mt-0.5">{parsedResult.work_mode || "Not specified"}</p>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px] uppercase mb-1">
                    Normalized Skills ({parsedResult.required_skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedResult.required_skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-[11px]">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px] uppercase mb-1">
                    Qualifications ({parsedResult.eligible_qualifications.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedResult.eligible_qualifications.length > 0 ? (
                      parsedResult.eligible_qualifications.map((q) => (
                        <Badge key={q} variant="outline" className="text-[11px]">
                          {q}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground italic">Open to all qualifications</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px] uppercase mb-1">
                    Graduation Batches
                  </span>
                  <p className="font-mono">
                    {parsedResult.eligible_graduation_years.length > 0
                      ? parsedResult.eligible_graduation_years.join(", ")
                      : "Open to all batches"}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-muted-foreground block text-[11px] uppercase mb-1">
                    Responsibilities
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    {parsedResult.responsibilities.slice(0, 4).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setParsedResult(null)}
                  size="sm"
                >
                  Back to Text
                </Button>
                <Button
                  type="button"
                  onClick={handleApplyToForm}
                  size="sm"
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4" /> Apply Extracted Data to Form
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
