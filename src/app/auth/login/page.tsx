"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
} from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { getUserRoleAction } from "@/app/actions/auth";

function getSafeRedirectPath(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return null;
  }

  try {
    const parsed = new URL(value, "https://placement-hub.local");

    if (parsed.origin !== "https://placement-hub.local") {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const explicitRedirect = getSafeRedirectPath(
    searchParams.get("redirect")
  );
  const errorParam = searchParams.get("error");

  const [serverError, setServerError] = useState<string | null>(
    errorParam === "InvalidOrExpiredLink"
      ? "Your verification or reset link has expired. Please sign in or request a new one."
      : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(
    null
  );

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginInput) => {
    setIsLoading(true);
    setServerError(null);
    setUnconfirmedEmail(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("email not confirmed") ||
          error.message.toLowerCase().includes("unconfirmed")
        ) {
          setUnconfirmedEmail(values.email);
          setServerError(
            "Your email has not been verified yet. Please enter the OTP sent to your inbox."
          );
        } else {
          setServerError(error.message);
        }

        return;
      }

      let destination = explicitRedirect;

      if (!destination) {
        try {
          const roleInfo = await getUserRoleAction();

          destination = getSafeRedirectPath(roleInfo?.redirectUrl);
        } catch (error) {
          console.error("Unable to retrieve user role after login:", error);
        }
      }

      router.replace(destination ?? "/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setServerError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during login."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtpLogin = async () => {
    const email = getValues("email")?.trim();

    if (!email) {
      setServerError(
        "Please enter your email above before requesting an OTP code."
      );
      return;
    }

    setIsLoading(true);
    setServerError(null);
    setUnconfirmedEmail(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        setServerError(error.message);
        return;
      }

      router.push(
        `/auth/verify-otp?email=${encodeURIComponent(email)}&type=email`
      );
    } catch (err: unknown) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Failed to send login OTP."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <GraduationCap className="h-6 w-6" />
        </div>

        <CardTitle className="text-2xl font-bold tracking-tight">
          Placement Hub Portal
        </CardTitle>

        <CardDescription>
          Sign in to your student or authorized placement account
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p>{serverError}</p>

                {unconfirmedEmail && (
                  <Link
                    href={`/auth/verify-otp?email=${encodeURIComponent(
                      unconfirmedEmail
                    )}&type=signup`}
                    className="inline-flex items-center text-xs font-semibold underline underline-offset-4"
                  >
                    Click here to enter your email OTP now
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="student@university.edu"
                className="pl-9"
                disabled={isLoading}
                {...register("email")}
              />
            </div>

            {errors.email && (
              <p className="text-xs font-medium text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>

              <Link
                href="/auth/forgot-password"
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="pl-9"
                disabled={isLoading}
                {...register("password")}
              />
            </div>

            {errors.password && (
              <p className="text-xs font-medium text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In with Password"
            )}
          </Button>

          <div className="relative w-full text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>

            <span className="relative bg-card px-2 text-xs uppercase text-muted-foreground">
              Or passwordless
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoading}
            onClick={handleRequestOtpLogin}
          >
            <KeyRound className="mr-2 h-4 w-4 text-primary" />
            Sign In with Email OTP Code
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Register as Student or Hiring Partner
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-8 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Loading login form...
          </p>
        </Card>
      }
    >
      <LoginContent />
    </Suspense>
  );
}