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
  const registeredParam = searchParams.get("registered");
  const emailParam = searchParams.get("email") || "";
  const errorParam = searchParams.get("error");

  const [serverError, setServerError] = useState<string | null>(
    errorParam === "InvalidOrExpiredLink"
      ? "Your verification or reset link has expired. Please sign in or request a new one."
      : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(
    registeredParam === "true"
      ? "Registration complete! Sign in with your password below."
      : null
  );
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
      email: emailParam,
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
            "Account email is not confirmed. In Supabase Dashboard -> Authentication -> Providers -> Email, disable 'Confirm email' (or confirm your user under Authentication -> Users) to enable direct password sign in without OTP."
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
              <AlertDescription>
                <p>{serverError}</p>
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