"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Award,
  GraduationCap,
  Calendar,
  Code2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { EligibilityResult } from "@/lib/services/eligibility";

interface EligibilityCardProps {
  eligibility: EligibilityResult;
  showBreakdownInitially?: boolean;
}

export function EligibilityCard({
  eligibility,
  showBreakdownInitially = false,
}: EligibilityCardProps) {
  const [expanded, setExpanded] = useState(showBreakdownInitially);
  const { isEligible, criteria, unmetReasons, matchPercentage } = eligibility;

  return (
    <Card className={cn(
      "border transition-all",
      isEligible ? "border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10" : "border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10"
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {isEligible ? (
              <Badge variant="success" className="text-xs px-2.5 py-1 flex items-center space-x-1.5 shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="font-semibold">Eligible to Apply</span>
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs px-2.5 py-1 flex items-center space-x-1.5 shadow-sm">
                <XCircle className="h-3.5 w-3.5" />
                <span className="font-semibold">Not Eligible</span>
              </Badge>
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {matchPercentage}% Criteria Met
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-xs h-7 px-2"
          >
            {expanded ? (
              <>
                <span>Hide Details</span>
                <ChevronUp className="ml-1 h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>View Criteria ({unmetReasons.length} Unmet)</span>
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1 space-y-3">
        {!isEligible && unmetReasons.length > 0 && !expanded && (
          <p className="text-xs text-amber-700 dark:text-amber-400 line-clamp-1">
            <strong>Unmet requirement:</strong> {unmetReasons[0]}
          </p>
        )}

        {expanded && (
          <div className="pt-2 border-t border-border/60 space-y-2.5">
            {/* CGPA */}
            <div className="flex items-start justify-between text-xs p-2 rounded-lg bg-card/80 border border-border/40">
              <div className="flex items-start space-x-2">
                <Award className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium text-foreground">{criteria.cgpa.name}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">{criteria.cgpa.message}</div>
                </div>
              </div>
              {criteria.cgpa.passed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
            </div>

            {/* Qualification */}
            <div className="flex items-start justify-between text-xs p-2 rounded-lg bg-card/80 border border-border/40">
              <div className="flex items-start space-x-2">
                <GraduationCap className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium text-foreground">{criteria.qualification.name}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">{criteria.qualification.message}</div>
                </div>
              </div>
              {criteria.qualification.passed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
            </div>

            {/* Graduation Year */}
            <div className="flex items-start justify-between text-xs p-2 rounded-lg bg-card/80 border border-border/40">
              <div className="flex items-start space-x-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium text-foreground">{criteria.graduationYear.name}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">{criteria.graduationYear.message}</div>
                </div>
              </div>
              {criteria.graduationYear.passed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
            </div>

            {/* Required Skills */}
            <div className="flex items-start justify-between text-xs p-2 rounded-lg bg-card/80 border border-border/40">
              <div className="flex items-start space-x-2">
                <Code2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium text-foreground">{criteria.skills.name}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">{criteria.skills.message}</div>
                </div>
              </div>
              {criteria.skills.passed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
            </div>

            {/* Application Deadline */}
            <div className="flex items-start justify-between text-xs p-2 rounded-lg bg-card/80 border border-border/40">
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium text-foreground">{criteria.deadline.name}</div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">{criteria.deadline.message}</div>
                </div>
              </div>
              {criteria.deadline.passed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
            </div>

            {!isEligible && (
              <div className="pt-2 flex justify-end">
                <Button variant="link" size="sm" asChild className="text-xs p-0 h-auto text-primary">
                  <Link href="/dashboard/profile" className="flex items-center">
                    <span>Update your academic profile to qualify</span>
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
