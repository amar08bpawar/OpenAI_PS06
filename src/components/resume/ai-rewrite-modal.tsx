"use client";

import React, { useState } from "react";
import { Sparkles, Check, X, AlertCircle, RefreshCw, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rewriteResumeContentAction } from "@/app/actions/resume";
import type { AIRewriteOutput } from "@/lib/services/resume";

interface AIRewriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: "summary" | "project" | "experience";
  originalText: string;
  onApply: (enhancedText: string) => void;
}

export function AIRewriteModal({
  isOpen,
  onClose,
  section,
  originalText,
  onApply,
}: AIRewriteModalProps) {
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIRewriteOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedSuggestion, setEditedSuggestion] = useState("");

  if (!isOpen) return null;

  const sectionLabels = {
    summary: "Professional Summary",
    project: "Project Description",
    experience: "Work / Internship Experience",
  };

  const handleGenerate = async () => {
    if (!originalText.trim()) {
      setError("Please write some draft text first before using AI enhancement.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await rewriteResumeContentAction({
        section,
        originalText,
        context: targetRole.trim() ? { role: targetRole.trim() } : undefined,
      });

      if (!res.success || !res.data) {
        setError(res.error || "Failed to generate rewrite suggestions.");
      } else {
        setResult(res.data);
        setEditedSuggestion(res.data.suggestion);
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (editedSuggestion.trim()) {
      onApply(editedSuggestion.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base">
                AI Rewrite: {sectionLabels[section]}
              </h3>
              <p className="text-xs text-muted-foreground">
                Polishes wording with impactful action verbs while preserving 100% of your factual details.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Target Role Context (Optional) */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Target Role (Optional context for tailored phrasing)
            </label>
            <input
              type="text"
              placeholder="e.g. Full Stack Developer, Data Analyst, Cloud Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full text-xs px-3 py-2 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Original Text */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Your Original Draft:
            </label>
            <div className="text-xs p-3 rounded-lg bg-muted/50 border border-border text-foreground max-h-32 overflow-y-auto whitespace-pre-wrap">
              {originalText.trim() || "(Empty draft)"}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Suggestion Area */}
          {result ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Suggested Enhancement (Editable):
                </label>
                {result.keyHighlights && result.keyHighlights.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {result.keyHighlights.map((k, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                rows={5}
                value={editedSuggestion}
                onChange={(e) => setEditedSuggestion(e.target.value)}
                className="w-full text-xs font-sans p-3 border rounded-lg bg-background border-primary/40 text-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed"
              />

              <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                🛡️ <strong>Non-Hallucination Policy:</strong> Review suggestions carefully before saving. AI enhances phrasing and highlights achievements, but never fabricates degrees, marks, or job history.
              </div>
            </div>
          ) : (
            !loading && (
              <div className="text-center py-6 border border-dashed rounded-lg border-border">
                <p className="text-xs text-muted-foreground mb-3">
                  Click below to generate action-oriented, ATS-optimized enhancements.
                </p>
                <Button onClick={handleGenerate} size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate AI Enhancement
                </Button>
              </div>
            )
          )}

          {loading && (
            <div className="py-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                Analyzing context and synthesizing action-oriented suggestions...
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-border bg-muted/20 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {result && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={loading}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
            )}
            <Button
              size="sm"
              onClick={result ? handleAccept : handleGenerate}
              disabled={loading || (!result && !originalText.trim())}
              className="gap-1.5"
            >
              {result ? (
                <>
                  <Check className="h-4 w-4" />
                  Accept & Apply
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Enhance Now
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
