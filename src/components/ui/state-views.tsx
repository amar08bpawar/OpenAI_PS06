import React from "react";
import { Loader2, AlertCircle, CheckCircle2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StateViewProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  className?: string;
}

export function LoadingState({
  title = "Loading data...",
  description = "Please wait while we retrieve the latest information.",
  className,
}: Partial<StateViewProps>) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title = "No records found",
  description = "Get started by creating your first entry or expanding your criteria.",
  action,
  className,
}: StateViewProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-6">
            <Button
              variant={action.variant || "default"}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred while processing your request.",
  action,
  className,
}: StateViewProps) {
  return (
    <Card className={cn("border-destructive/30 bg-destructive/5", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold text-destructive">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-6">
            <Button
              variant={action.variant || "outline"}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SuccessState({
  title = "Operation Successful",
  description = "Your changes have been saved successfully.",
  action,
  className,
}: StateViewProps) {
  return (
    <Card className={cn("border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/10", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-6">
            <Button
              variant={action.variant || "default"}
              size="sm"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
