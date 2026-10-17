"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GraduationCap,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  BookOpen,
  Award,
  Briefcase,
  ShieldAlert,
} from "lucide-react";

import {
  registerSchema,
  recruiterRegisterSchema,
  type RegisterInput,
  type RecruiterRegisterInput,
} from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { recordRecruiterSignupAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const courseOptions = [
  "B.Tech / B.E. Computer Science & Engineering",
  "B.Tech / B.E. Information Technology",
  "B.Tech / B.E. Electronics & Communication",
  "B.Tech / B.E. Mechanical / Civil / Other",
  "MCA (Master of Computer Applications)",
  "M.Tech / M.E. Computer Science",
  "B.Sc / M.Sc Computer Science / IT",
  "BCA (Bachelor of Computer Applications)",
  "Other Degree / Program",
];

const qualificationOptions = [
  "Undergraduate (Final Year)",
  "Undergraduate (Pre-Final Year)",
  "Postgraduate",
  "Recent Graduate",
  "Diploma / Associate",
];

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"student" | "recruiter">("student");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Student Form
  const {
    register: registerStudent,
    handleSubmit: handleSubmitStudent,
    formState: { errors: studentErrors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      course: courseOptions[0],
      qualification: qualificationOptions[0],
    },
  });

  // Recruiter Form
  const {
    register: registerRecruiter,
    handleSubmit: handleSubmitRecruiter,
    formState: { errors: recruiterErrors },
  } = useForm<RecruiterRegisterInput>({
    resolver: zodResolver(recruiterRegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      companyName: "",
      designation: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onStudentSubmit = async (values: RegisterInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            course: values.course,
            qualification: values.qualification,
            role: "student",
          },
          emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        setServerError(error.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        return;
      }

      router.push(`/auth/verify-otp?email=${encodeURIComponent(values.email)}&type=signup`);
    } catch (err: any) {
      setServerError(err?.message || "An unexpected error occurred during registration.");
      setIsLoading(false);
    }
  };

  const onRecruiterSubmit = async (values: RecruiterRegisterInput) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            company_name: values.companyName,
            designation: values.designation,
            // Database trigger handle_new_user() will strictly enforce role='student' initially.
            // Recruiter role requires institutional administrator activation.
            role: "recruiter",
          },
          emailRedirectTo: `${siteUrl}/auth/callback?next=/recruiter`,
        },
      });

      if (error) {
        setServerError(error.message);
        setIsLoading(false);
        return;
      }

      // If session is active immediately (e.g. dev mode without email confirmation)
      if (data.session) {
        await recordRecruiterSignupAction({
          companyName: values.companyName,
          designation: values.designation,
        });
        router.push("/recruiter");
        return;
      }

      router.push(
        `/auth/verify-otp?email=${encodeURIComponent(values.email)}&type=signup&role=recruiter`
      );
    } catch (err: any) {
      setServerError(err?.message || "An unexpected error occurred during registration.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
          {accountType === "student" ? (
            <GraduationCap className="h-6 w-6" />
          ) : (
            <Building2 className="h-6 w-6" />
          )}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {accountType === "student" ? "Create Student Account" : "Hiring Partner Registration"}
        </CardTitle>
        <CardDescription>
          {accountType === "student"
            ? "Enter your academic credentials to join the Placement Hub portal"
            : "Register your organization to conduct campus recruitment drives"}
        </CardDescription>

        {/* Role Toggle Switcher */}
        <div className="pt-2">
          <div className="grid grid-cols-2 p-1 bg-muted rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAccountType("student");
                setServerError(null);
              }}
              className={`flex items-center justify-center py-2 rounded-lg transition-all ${
                accountType === "student"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GraduationCap className="h-4 w-4 mr-1.5" />
              <span>Student Account</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAccountType("recruiter");
                setServerError(null);
              }}
              className={`flex items-center justify-center py-2 rounded-lg transition-all ${
                accountType === "recruiter"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-4 w-4 mr-1.5" />
              <span>Recruiter / Hiring Partner</span>
            </button>
          </div>
        </div>
      </CardHeader>

      {/* STUDENT REGISTRATION FORM */}
      {accountType === "student" && (
        <form onSubmit={handleSubmitStudent(onStudentSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="studentFullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="studentFullName"
                  placeholder="Jane Doe"
                  className="pl-9"
                  disabled={isLoading}
                  {...registerStudent("fullName")}
                />
              </div>
              {studentErrors.fullName && (
                <p className="text-xs text-destructive font-medium">
                  {studentErrors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="studentEmail">College or Personal Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="studentEmail"
                  type="email"
                  placeholder="jane.doe@university.edu"
                  className="pl-9"
                  disabled={isLoading}
                  {...registerStudent("email")}
                />
              </div>
              {studentErrors.email && (
                <p className="text-xs text-destructive font-medium">
                  {studentErrors.email.message}
                </p>
              )}
            </div>

            {/* Course / Program */}
            <div className="space-y-1.5">
              <Label htmlFor="studentCourse">Course / Degree</Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <select
                  id="studentCourse"
                  className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                  {...registerStudent("course")}
                >
                  {courseOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              {studentErrors.course && (
                <p className="text-xs text-destructive font-medium">
                  {studentErrors.course.message}
                </p>
              )}
            </div>

            {/* Qualification Level */}
            <div className="space-y-1.5">
              <Label htmlFor="studentQualification">Current Qualification Level</Label>
              <div className="relative">
                <Award className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <select
                  id="studentQualification"
                  className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                  {...registerStudent("qualification")}
                >
                  {qualificationOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              {studentErrors.qualification && (
                <p className="text-xs text-destructive font-medium">
                  {studentErrors.qualification.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="studentPassword">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="studentPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  disabled={isLoading}
                  {...registerStudent("password")}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Min 8 characters with upper, lowercase & numbers
              </p>
              {studentErrors.password && (
                <p className="text-xs text-destructive font-medium">
                  {studentErrors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="studentConfirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="studentConfirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  disabled={isLoading}
                  {...registerStudent("confirmPassword")}
                />
              </div>
              {studentErrors.confirmPassword && (
                <p className="text-xs text-destructive font-medium">
                  {studentErrors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Student Account...
                </>
              ) : (
                "Complete Student Registration"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-primary hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      )}

      {/* RECRUITER REGISTRATION FORM */}
      {accountType === "recruiter" && (
        <form onSubmit={handleSubmitRecruiter(onRecruiterSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* Verification Security Notice */}
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="font-semibold">Institutional Verification Required</p>
                <p className="leading-relaxed opacity-90">
                  To protect campus recruitment integrity, recruiter accounts are registered with pending verification. An administrator will verify your organization before listings can be published.
                </p>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="recruiterFullName">Full Name / Primary Contact</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recruiterFullName"
                  placeholder="Alex Morgan"
                  className="pl-9"
                  disabled={isLoading}
                  {...registerRecruiter("fullName")}
                />
              </div>
              {recruiterErrors.fullName && (
                <p className="text-xs text-destructive font-medium">
                  {recruiterErrors.fullName.message}
                </p>
              )}
            </div>

            {/* Work Email */}
            <div className="space-y-1.5">
              <Label htmlFor="recruiterEmail">Corporate / Work Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recruiterEmail"
                  type="email"
                  placeholder="alex.morgan@company.com"
                  className="pl-9"
                  disabled={isLoading}
                  {...registerRecruiter("email")}
                />
              </div>
              {recruiterErrors.email && (
                <p className="text-xs text-destructive font-medium">
                  {recruiterErrors.email.message}
                </p>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-1.5">
              <Label htmlFor="recruiterCompanyName">Hiring Organization / Company Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recruiterCompanyName"
                  placeholder="e.g., Acme Cloud Dynamics"
                  className="pl-9"
                  disabled={isLoading}
                  {...registerRecruiter("companyName")}
                />
              </div>
              {recruiterErrors.companyName && (
                <p className="text-xs text-destructive font-medium">
                  {recruiterErrors.companyName.message}
                </p>
              )}
            </div>

            {/* Designation */}
            <div className="space-y-1.5">
              <Label htmlFor="recruiterDesignation">Designation / Role Title</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recruiterDesignation"
                  placeholder="e.g., Lead Campus Recruiter, Talent Partner"
                  className="pl-9"
                  disabled={isLoading}
                  {...registerRecruiter("designation")}
                />
              </div>
              {recruiterErrors.designation && (
                <p className="text-xs text-destructive font-medium">
                  {recruiterErrors.designation.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="recruiterPassword">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recruiterPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  disabled={isLoading}
                  {...registerRecruiter("password")}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Min 8 characters with upper, lowercase & numbers
              </p>
              {recruiterErrors.password && (
                <p className="text-xs text-destructive font-medium">
                  {recruiterErrors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="recruiterConfirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="recruiterConfirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  disabled={isLoading}
                  {...registerRecruiter("confirmPassword")}
                />
              </div>
              {recruiterErrors.confirmPassword && (
                <p className="text-xs text-destructive font-medium">
                  {recruiterErrors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Recruiter Application...
                </>
              ) : (
                "Submit Recruiter Application"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-primary hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
