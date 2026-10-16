"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  KeyRound,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Mail,
  ArrowLeft,
} from "lucide-react";

import { verifyOtpSchema, type VerifyOtpInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const emailParam = searchParams.get("email") || "";
  const typeParam = (searchParams.get("type") as "signup" | "email" | "recovery") || "signup";

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyOtpInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      email: emailParam,
      token: "",
      type: typeParam,
    },
  });

  useEffect(() => {
    if (emailParam) {
      setValue("email", emailParam);
    }
    if (typeParam) {
      setValue("type", typeParam);
    }
  }, [emailParam, typeParam, setValue]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = async (values: VerifyOtpInput) => {
    setIsLoading(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: values.email,
        token: values.token,
        type: values.type as any,
      });

      if (error) {
        setServerError(error.message);
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Verification successful! Redirecting to your dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setServerError(err?.message || "Failed to verify one-time password.");
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsResending(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const emailValue = emailParam || (document.getElementById("email") as HTMLInputElement)?.value;
      if (!emailValue) {
        setServerError("Please specify a valid email address to resend OTP.");
        setIsResending(false);
        return;
      }

      let error = null;
      if (typeParam === "email") {
        const res = await supabase.auth.signInWithOtp({
          email: emailValue,
          options: { shouldCreateUser: false },
        });
        error = res.error;
      } else {
        const res = await supabase.auth.resend({
          type: "signup",
          email: emailValue,
        });
        error = res.error;
      }

      if (error) {
        setServerError(error.message);
      } else {
        setSuccessMessage("A fresh 6-digit verification code has been dispatched to your email.");
        setCanResend(false);
        setCountdown(60);
      }
    } catch (err: any) {
      setServerError(err?.message || "Failed to resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Verify Email OTP
        </CardTitle>
        <CardDescription>
          Enter the 6-digit verification token sent to your email address
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Email field (readonly if present from URL, editable if missing) */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Registered Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                className="pl-9"
                disabled={isLoading || !!emailParam}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* 6-digit OTP Token */}
          <div className="space-y-1.5">
            <Label htmlFor="token">6-Digit Verification Code</Label>
            <div className="relative">
              <Input
                id="token"
                type="text"
                maxLength={6}
                placeholder="123456"
                className="text-center tracking-widest text-lg font-mono font-bold"
                disabled={isLoading}
                {...register("token")}
              />
            </div>
            {errors.token && (
              <p className="text-xs text-destructive font-medium">
                {errors.token.message}
              </p>
            )}
          </div>

          {/* Resend OTP button with countdown */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-muted-foreground">Didn&apos;t receive the code?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={!canResend || isResending}
              className="text-primary hover:underline font-semibold disabled:opacity-50 disabled:no-underline flex items-center space-x-1"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  Sending...
                </>
              ) : canResend ? (
                "Resend Code"
              ) : (
                `Resend in ${countdown}s`
              )}
            </button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying Code...
              </>
            ) : (
              "Confirm & Enter Portal"
            )}
          </Button>

          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
            <Link
              href="/auth/login"
              className="flex items-center text-primary hover:underline"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Back to Login
            </Link>
            <Link
              href="/auth/register"
              className="text-muted-foreground hover:text-foreground"
            >
              Need to register?
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading verification session...</p>
        </Card>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
