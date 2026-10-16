"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  GraduationCap,
  BookOpen,
  Award,
  Calendar,
  Percent,
  Github,
  Code2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Save,
} from "lucide-react";

import { studentProfileSchema, type StudentProfileInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { Profile, StudentDetails } from "@/types/database";

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string>("student");
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentProfileInput>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      fullName: "",
      course: "",
      qualification: "",
      branch: "",
      graduationYear: 2026,
      cgpa: 8.5,
      githubUsername: "",
      skills: "",
    },
  });

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (user) {
          setUserId(user.id);

          // 1. Fetch profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          const profile = profileData as Profile | null;

          if (profile) {
            setCurrentRole(profile.role);
          }

          // 2. Fetch student details
          const { data: detailsData } = await supabase
            .from("student_details")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
          const details = detailsData as StudentDetails | null;

          reset({
            fullName: profile?.full_name || (user.user_metadata?.full_name as string) || "",
            course: details?.course || (user.user_metadata?.course as string) || "B.Tech Computer Science",
            qualification: details?.qualification || (user.user_metadata?.qualification as string) || "Undergraduate",
            branch: details?.branch || "",
            graduationYear: details?.graduation_year || 2026,
            cgpa: details?.cgpa ? Number(details.cgpa) : undefined,
            githubUsername: details?.github_username || "",
            skills: details?.skills ? details.skills.join(", ") : "",
          });
        }
      } catch (err: any) {
        setServerError("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [reset, supabase]);

  const onSubmit = async (values: StudentProfileInput) => {
    if (!userId) return;

    setIsSaving(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      // 1. Update public.profiles (fullName only; role cannot be modified by user)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: values.fullName,
        })
        .eq("id", userId);

      if (profileError) {
        throw new Error(profileError.message);
      }

      // Format skills array
      const skillsArray = values.skills
        ? values.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      // 2. Upsert public.student_details
      const { error: detailsError } = await supabase
        .from("student_details")
        .upsert(
          {
            user_id: userId,
            course: values.course,
            qualification: values.qualification,
            branch: values.branch || null,
            graduation_year: values.graduationYear || null,
            cgpa: values.cgpa || null,
            github_username: values.githubUsername || null,
            skills: skillsArray,
          },
          { onConflict: "user_id" }
        );

      if (detailsError) {
        throw new Error(detailsError.message);
      }

      setSuccessMessage("Your profile and academic credentials were saved successfully!");
    } catch (err: any) {
      setServerError(err?.message || "Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Retrieving student academic records...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your personal academic records, qualifications, and GitHub skill handles.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">System Role:</span>
          <Badge variant="outline" className="capitalize text-xs font-semibold">
            {currentRole}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

        {/* Basic Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <User className="h-4 w-4 text-primary" />
              <span>Identity & Personal Details</span>
            </CardTitle>
            <CardDescription>
              Basic identifying information associated with your placement account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  disabled={isSaving}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>User Role (Restricted)</Label>
                <div className="flex items-center justify-between h-10 px-3 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground cursor-not-allowed">
                  <span className="capitalize">{currentRole}</span>
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Role elevation requires trusted administrator approval.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Program & Qualifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>Academic Curriculum & Scores</span>
            </CardTitle>
            <CardDescription>
              Degree, specialization branch, graduation timeline, and academic score
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="course">Degree / Course Program</Label>
                <Input
                  id="course"
                  placeholder="e.g., B.Tech Computer Science"
                  disabled={isSaving}
                  {...register("course")}
                />
                {errors.course && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.course.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qualification">Qualification Level</Label>
                <Input
                  id="qualification"
                  placeholder="e.g., Undergraduate, Postgraduate"
                  disabled={isSaving}
                  {...register("qualification")}
                />
                {errors.qualification && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.qualification.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branch">Branch / Specialization (Optional)</Label>
                <Input
                  id="branch"
                  placeholder="e.g., AI & Data Engineering"
                  disabled={isSaving}
                  {...register("branch")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  placeholder="2026"
                  disabled={isSaving}
                  {...register("graduationYear")}
                />
                {errors.graduationYear && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.graduationYear.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cgpa">Cumulative CGPA (0.0 - 10.0)</Label>
                <Input
                  id="cgpa"
                  type="number"
                  step="0.01"
                  placeholder="8.75"
                  disabled={isSaving}
                  {...register("cgpa")}
                />
                {errors.cgpa && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.cgpa.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skill Evidence & GitHub Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Github className="h-4 w-4 text-primary" />
              <span>Skill Evidence & Developer Handles</span>
            </CardTitle>
            <CardDescription>
              Link your public developer portfolio for skill verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="githubUsername">Public GitHub Username</Label>
              <div className="relative">
                <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="githubUsername"
                  placeholder="octocat"
                  className="pl-9"
                  disabled={isSaving}
                  {...register("githubUsername")}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Allows recruiters to inspect public repository languages and commit signals.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="skills">Self-Reported Technical Skills (Comma separated)</Label>
              <div className="relative">
                <Code2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="skills"
                  placeholder="React, TypeScript, Node.js, PostgreSQL, Python"
                  className="pl-9"
                  disabled={isSaving}
                  {...register("skills")}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Enter primary skills separated by commas.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end pt-4 border-t border-border">
            <Button type="submit" disabled={isSaving} className="flex items-center space-x-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Profile Updates</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
