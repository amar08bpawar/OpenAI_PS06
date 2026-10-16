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
  Building,
  Phone,
  Linkedin,
  Briefcase,
  FolderGit2,
  HeartHandshake,
  Check,
} from "lucide-react";

import { studentProfileSchema, type StudentProfileInput } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { Profile, StudentDetails, ProjectItem, ExperienceItem } from "@/types/database";

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string>("student");
  const [userId, setUserId] = useState<string | null>(null);

  // Dynamic projects & experience lists
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [newProject, setNewProject] = useState<ProjectItem>({
    title: "",
    description: "",
    tech_stack: [],
    link: "",
  });
  const [newProjectTech, setNewProjectTech] = useState("");

  const [experience, setExperience] = useState<ExperienceItem[]>([]);
  const [newExp, setNewExp] = useState<ExperienceItem>({
    role: "",
    company: "",
    duration: "",
    description: "",
  });

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<StudentProfileInput>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      fullName: "",
      college: "",
      course: "",
      qualification: "",
      branch: "",
      graduationYear: 2026,
      cgpa: 8.5,
      githubUsername: "",
      linkedinUrl: "",
      phone: "",
      skills: "",
      softSkills: "",
    },
  });

  const watchedValues = watch();

  // Calculate profile completeness
  const trackedFields = [
    watchedValues.fullName,
    watchedValues.college,
    watchedValues.course,
    watchedValues.qualification,
    watchedValues.graduationYear,
    watchedValues.cgpa,
    watchedValues.skills,
    watchedValues.softSkills,
    watchedValues.githubUsername,
    projects.length > 0 ? "projects" : "",
    experience.length > 0 ? "experience" : "",
  ];
  const filledCount = trackedFields.filter(Boolean).length;
  const completionPercentage = Math.round((filledCount / trackedFields.length) * 100);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        if (user) {
          setUserId(user.id);

          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          const profile = profileData as Profile | null;

          if (profile) {
            setCurrentRole(profile.role);
          }

          const { data: detailsData } = await supabase
            .from("student_details")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
          const details = detailsData as StudentDetails | null;

          reset({
            fullName: profile?.full_name || (user.user_metadata?.full_name as string) || "",
            college: details?.college || "",
            course: details?.course || (user.user_metadata?.course as string) || "B.Tech Computer Science",
            qualification: details?.qualification || (user.user_metadata?.qualification as string) || "Undergraduate",
            branch: details?.branch || "",
            graduationYear: details?.graduation_year || 2026,
            cgpa: details?.cgpa ? Number(details.cgpa) : undefined,
            githubUsername: details?.github_username || "",
            linkedinUrl: details?.linkedin_url || "",
            phone: details?.phone || "",
            skills: details?.skills ? details.skills.join(", ") : "",
            softSkills: details?.soft_skills ? details.soft_skills.join(", ") : "",
          });

          if (details?.projects && Array.isArray(details.projects)) {
            setProjects(details.projects);
          }
          if (details?.experience && Array.isArray(details.experience)) {
            setExperience(details.experience);
          }
        }
      } catch (err: any) {
        setServerError("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [reset, supabase]);

  const addProject = () => {
    if (!newProject.title.trim()) return;
    const techArray = newProjectTech
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setProjects([...projects, { ...newProject, tech_stack: techArray }]);
    setNewProject({ title: "", description: "", tech_stack: [], link: "" });
    setNewProjectTech("");
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    if (!newExp.role.trim() || !newExp.company.trim()) return;
    setExperience([...experience, newExp]);
    setNewExp({ role: "", company: "", duration: "", description: "" });
  };

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

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

      // Format skills arrays
      const techSkills = values.skills
        ? values.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const softSkills = values.softSkills
        ? values.softSkills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      // 2. Upsert public.student_details
      const { error: detailsError } = await supabase
        .from("student_details")
        .upsert(
          {
            user_id: userId,
            college: values.college || "",
            course: values.course,
            qualification: values.qualification,
            branch: values.branch || null,
            graduation_year: values.graduationYear || null,
            cgpa: values.cgpa || null,
            github_username: values.githubUsername || null,
            linkedin_url: values.linkedinUrl || "",
            phone: values.phone || "",
            skills: techSkills,
            soft_skills: softSkills,
            projects: projects as any,
            experience: experience as any,
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
          <h1 className="text-2xl font-bold tracking-tight">Academic & Placement Profile</h1>
          <p className="text-sm text-muted-foreground">
            Complete your profile to qualify for campus job and internship opportunities.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">System Role:</span>
          <Badge variant="outline" className="capitalize text-xs font-semibold">
            {currentRole}
          </Badge>
        </div>
      </div>

      {/* Profile Completion Indicator */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-foreground">Profile Completion</span>
                <Badge variant={completionPercentage >= 80 ? "success" : "info"} className="text-xs">
                  {completionPercentage}% Complete
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {completionPercentage >= 80
                  ? "Great job! Your profile meets requirements for automated eligibility checks."
                  : "Fill in your college, CGPA, technical skills, projects, and soft skills to maximize eligibility."}
              </p>
            </div>
            <div className="w-full sm:w-48 bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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

        {/* 1. Identity & Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <User className="h-4 w-4 text-primary" />
              <span>Identity & Contact Details</span>
            </CardTitle>
            <CardDescription>
              Basic personal and contact information for placement communication
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
                  <p className="text-xs text-destructive font-medium">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="college">College / University</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="college"
                    placeholder="e.g., National Institute of Technology"
                    className="pl-9"
                    disabled={isSaving}
                    {...register("college")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Contact Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+91 9876543210"
                    className="pl-9"
                    disabled={isSaving}
                    {...register("phone")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="linkedinUrl"
                    placeholder="https://linkedin.com/in/username"
                    className="pl-9"
                    disabled={isSaving}
                    {...register("linkedinUrl")}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Academic Curriculum & Marks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>Academic Curriculum & Scores</span>
            </CardTitle>
            <CardDescription>
              Degree, specialization branch, graduation year, and CGPA used by eligibility filters
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
                  <p className="text-xs text-destructive font-medium">{errors.course.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qualification">Qualification Level</Label>
                <Input
                  id="qualification"
                  placeholder="e.g., B.Tech, MCA, Postgraduate"
                  disabled={isSaving}
                  {...register("qualification")}
                />
                {errors.qualification && (
                  <p className="text-xs text-destructive font-medium">{errors.qualification.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branch">Branch / Specialization (Optional)</Label>
                <Input
                  id="branch"
                  placeholder="e.g., Computer Science & Engineering"
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
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cgpa">Cumulative CGPA (0.0 - 10.0)</Label>
                <Input
                  id="cgpa"
                  type="number"
                  step="0.01"
                  placeholder="8.50"
                  disabled={isSaving}
                  {...register("cgpa")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Technical & Soft Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Code2 className="h-4 w-4 text-primary" />
              <span>Skills & Developer Portfolios</span>
            </CardTitle>
            <CardDescription>
              Technical proficiencies used for recruiter skill matching and public portfolios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="skills">Technical Skills (Comma separated)</Label>
              <div className="relative">
                <Code2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="skills"
                  placeholder="React, TypeScript, Next.js, Node.js, PostgreSQL, Python"
                  className="pl-9"
                  disabled={isSaving}
                  {...register("skills")}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                These skills are directly checked against recruiter required skills.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="softSkills">Soft Skills (Comma separated)</Label>
              <div className="relative">
                <HeartHandshake className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="softSkills"
                  placeholder="Communication, Team Leadership, Problem Solving, Agile"
                  className="pl-9"
                  disabled={isSaving}
                  {...register("softSkills")}
                />
              </div>
            </div>

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
            </div>
          </CardContent>
        </Card>

        {/* 4. Projects Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <FolderGit2 className="h-4 w-4 text-primary" />
              <span>Academic & Personal Projects</span>
            </CardTitle>
            <CardDescription>
              Highlight significant projects showcasing practical implementation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.length > 0 && (
              <div className="space-y-2 mb-4">
                {projects.map((proj, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-card flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{proj.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{proj.description}</p>
                      {proj.tech_stack.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {proj.tech_stack.map((t, ti) => (
                            <Badge key={ti} variant="secondary" className="text-[10px] py-0 px-1.5">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProject(idx)}
                      className="text-xs text-destructive h-7 px-2 hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Project Sub-form */}
            <div className="p-3.5 border border-dashed rounded-lg bg-muted/30 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Add New Project
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Project Title (e.g., Placement Portal)"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                />
                <Input
                  placeholder="Tech Stack (comma separated e.g. React, Node.js)"
                  value={newProjectTech}
                  onChange={(e) => setNewProjectTech(e.target.value)}
                />
              </div>
              <Input
                placeholder="Short Description of project goals and achievements"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
              <div className="flex justify-between items-center">
                <Input
                  placeholder="Project / Demo Link (Optional)"
                  className="max-w-xs"
                  value={newProject.link || ""}
                  onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                />
                <Button type="button" variant="outline" size="sm" onClick={addProject}>
                  + Add Project
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Experience / Internships Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <span>Prior Experience & Internships</span>
            </CardTitle>
            <CardDescription>
              Relevant work, internships, or leadership positions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {experience.length > 0 && (
              <div className="space-y-2 mb-4">
                {experience.map((exp, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-card flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">
                        {exp.role} <span className="font-normal text-muted-foreground">at {exp.company}</span>
                      </h4>
                      <p className="text-xs text-muted-foreground">{exp.duration}</p>
                      <p className="text-xs mt-1">{exp.description}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(idx)}
                      className="text-xs text-destructive h-7 px-2 hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Experience Sub-form */}
            <div className="p-3.5 border border-dashed rounded-lg bg-muted/30 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Add Work / Internship Experience
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  placeholder="Role (e.g. Software Intern)"
                  value={newExp.role}
                  onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                />
                <Input
                  placeholder="Company / Organization"
                  value={newExp.company}
                  onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                />
                <Input
                  placeholder="Duration (e.g. May - July 2025)"
                  value={newExp.duration}
                  onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
                />
              </div>
              <div className="flex justify-between items-center gap-3">
                <Input
                  placeholder="Responsibilities, achievements, or technologies used"
                  value={newExp.description}
                  onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                />
                <Button type="button" variant="outline" size="sm" onClick={addExperience} className="shrink-0">
                  + Add Experience
                </Button>
              </div>
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
                  <span>Save Complete Profile</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
