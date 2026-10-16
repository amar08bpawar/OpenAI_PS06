"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { applyForPosition } from "@/app/actions/applications";
import type { ApplicationStatus, ApplicationType } from "@/types/database";
import type { EligibilityResult } from "@/lib/services/eligibility";

interface ApplyButtonProps {
  targetId: string;
  type: ApplicationType;
  title: string;
  companyName: string;
  existingApplication?: { id: string; status: ApplicationStatus } | null;
  eligibility?: EligibilityResult;
  userRole?: string;
}

export function ApplyButton({
  targetId,
  type,
  title,
  companyName,
  existingApplication,
  eligibility,
  userRole,
}: ApplyButtonProps) {
  const router = useRouter();
  const [isApplying, setIsApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (existingApplication) {
    const status = existingApplication.status;
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" | "success" | "info" = "secondary";
    if (status === "Selected") badgeVariant = "success";
    if (status === "Shortlisted" || status === "Interview") badgeVariant = "info";
    if (status === "Rejected") badgeVariant = "destructive";

    return (
      <div className="flex items-center space-x-2">
        <Badge variant={badgeVariant} className="text-xs px-3 py-1 font-semibold">
          Application: {status}
        </Badge>
      </div>
    );
  }

  // Non-students shouldn't see the apply button
  if (userRole && userRole !== "student") {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Recruiter Preview Mode
      </Badge>
    );
  }

  const handleApply = async () => {
    setIsApplying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await applyForPosition({
        targetId,
        type,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to apply.");
      } else {
        setSuccessMsg("Application submitted successfully!");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setIsApplying(false);
    }
  };

  const isEligible = eligibility?.isEligible ?? true;

  return (
    <div className="flex flex-col items-end space-y-1.5">
      <Button
        onClick={handleApply}
        disabled={isApplying || !isEligible}
        className="flex items-center space-x-2 shadow-sm"
      >
        {isApplying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Submitting...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span>Apply Now</span>
          </>
        )}
      </Button>

      {errorMsg && (
        <p className="text-xs text-destructive flex items-center font-medium mt-1">
          <AlertCircle className="h-3.5 w-3.5 mr-1 shrink-0" />
          {errorMsg}
        </p>
      )}

      {successMsg && (
        <p className="text-xs text-emerald-600 flex items-center font-medium mt-1">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1 shrink-0" />
          {successMsg}
        </p>
      )}
    </div>
  );
}
