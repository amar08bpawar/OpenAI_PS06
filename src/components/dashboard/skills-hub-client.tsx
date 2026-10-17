"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  GraduationCap,
  ShieldAlert,
  ChevronDown,
  Trash2,
  ArrowRight,
  Filter,
  RefreshCw,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { COURSERA_CATEGORIES, type CourseraCourse } from "@/lib/services/coursera";
import {
  saveCourseAction,
  removeSavedCourseAction,
  updateSavedCourseStatusAction,
} from "@/app/actions/learning";
import type { SavedCourseStatus, StudentSavedCourse } from "@/types/database";

interface SkillsHubClientProps {
  initialCourses: CourseraCourse[];
  recommendedCourses: CourseraCourse[];
  initialSavedCourses: StudentSavedCourse[];
  configStatus: {
    configured: boolean;
    hasClientId: boolean;
    hasClientSecret: boolean;
    hasOrgId: boolean;
    statusMessage: string;
  };
  studentSkills: string[];
}

export function SkillsHubClient({
  initialCourses,
  recommendedCourses,
  initialSavedCourses,
  configStatus,
  studentSkills,
}: SkillsHubClientProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "my-learning" | "recommended">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [savedCourses, setSavedCourses] = useState<StudentSavedCourse[]>(initialSavedCourses);
  const [learningFilter, setLearningFilter] = useState<string>("All");
  const [showConfigNotice, setShowConfigNotice] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Map saved courses for instant O(1) lookup
  const savedMap = new Map<string, StudentSavedCourse>();
  savedCourses.forEach((sc) => savedMap.set(sc.course_id, sc));

  // Filter explore catalog
  const filteredCourses = initialCourses.filter((course) => {
    const matchesCategory =
      selectedCategory === "All Categories" ||
      course.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesDifficulty =
      selectedDifficulty === "All" ||
      course.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

    const matchesQuery =
      !searchQuery.trim() ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.partner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesDifficulty && matchesQuery;
  });

  // Filter saved courses
  const filteredSavedCourses = savedCourses.filter((course) => {
    if (learningFilter === "All") return true;
    return course.status === learningFilter;
  });

  // Learning progress statistics
  const inProgressCount = savedCourses.filter((c) => c.status === "In Progress").length;
  const completedCount = savedCourses.filter((c) => c.status === "Completed").length;
  const savedCount = savedCourses.filter((c) => c.status === "Saved").length;
  const uniqueSkillsTracked = Array.from(
    new Set(savedCourses.flatMap((c) => c.skills || []))
  );

  const handleSaveCourse = (course: CourseraCourse) => {
    startTransition(async () => {
      const res = await saveCourseAction({
        course_id: course.id,
        provider: "coursera",
        title: course.title,
        partner_name: course.partner_name,
        course_url: course.course_url,
        image_url: course.image_url,
        category: course.category,
        difficulty: course.difficulty,
        skills: course.skills,
        status: "Saved",
      });

      if (res.success && res.savedCourse) {
        setSavedCourses((prev) => {
          const exists = prev.some((c) => c.course_id === course.id);
          if (exists) {
            return prev.map((c) => (c.course_id === course.id ? res.savedCourse! : c));
          }
          return [res.savedCourse!, ...prev];
        });
        showFeedback(`Added "${course.title}" to your learning plan!`, "success");
      } else {
        showFeedback(res.error || "Failed to save course", "error");
      }
    });
  };

  const handleRemoveCourse = (courseId: string, title: string) => {
    startTransition(async () => {
      const res = await removeSavedCourseAction(courseId, "coursera");
      if (res.success) {
        setSavedCourses((prev) => prev.filter((c) => c.course_id !== courseId));
        showFeedback(`Removed "${title}" from your learning plan.`, "success");
      } else {
        showFeedback(res.error || "Failed to remove course", "error");
      }
    });
  };

  const handleStatusChange = (courseId: string, newStatus: SavedCourseStatus) => {
    startTransition(async () => {
      const res = await updateSavedCourseStatusAction(courseId, newStatus, "coursera");
      if (res.success && res.updatedCourse) {
        setSavedCourses((prev) =>
          prev.map((c) => (c.course_id === courseId ? res.updatedCourse! : c))
        );
        showFeedback(`Course marked as ${newStatus}!`, "success");
      } else {
        showFeedback(res.error || "Failed to update course progress", "error");
      }
    });
  };

  const showFeedback = (text: string, type: "success" | "error") => {
    setActionMessage({ text, type });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 shadow-xl transition-all border text-sm font-medium ${
            actionMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20"
              : "bg-rose-600 text-white border-rose-500 shadow-rose-500/20"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-transparent text-xs font-semibold backdrop-blur-sm">
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              Coursera Skill Hub
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs border-white/30 text-white ${
                configStatus.configured ? "bg-emerald-500/20" : "bg-sky-500/20"
              }`}
            >
              {configStatus.configured ? "Live Partner API" : "Verified Direct Catalog"}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Skill Development & Coursera Certifications
          </h1>
          <p className="text-white/90 text-sm leading-relaxed">
            Enhance your placement candidacy with verified, university-backed and industry-recognized certifications
            from Stanford, Google, Meta, IBM, DeepLearning.AI, and AWS. Track your progress and bridge skill gaps.
          </p>
        </div>

        {/* API Transparency Notice Toggle */}
        <div className="relative z-10 mt-4 flex items-center justify-between border-t border-white/15 pt-3">
          <div className="flex items-center text-xs text-white/80">
            <Info className="h-4 w-4 mr-1.5 shrink-0" />
            <span>
              {configStatus.configured
                ? "Connected to Coursera Partner Developer API."
                : "Displaying verified curated catalog with direct links to coursera.org courses."}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfigNotice(!showConfigNotice)}
            className="text-xs text-white hover:bg-white/10 hover:text-white h-7 px-2"
          >
            {showConfigNotice ? "Hide Details" : "API Integration Info"}
          </Button>
        </div>
      </div>

      {/* Expandable Coursera API Configuration Notice */}
      {showConfigNotice && (
        <Card className="border-border/80 bg-muted/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Coursera Catalog API Configuration Guide</CardTitle>
              </div>
              <Badge variant={configStatus.configured ? "success" : "secondary"}>
                {configStatus.configured ? "Configured" : "Catalog Mode"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Coursera developer integration requirements and architectural boundaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <p>
              According to official Coursera developer documentation (
              <a
                href="https://dev.coursera.com"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                dev.coursera.com
              </a>
              ), Coursera REST APIs are governed under Coursera for Campus / Enterprise partnerships requiring SAML SSO login.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg border bg-card/60">
                <span className="font-semibold block text-foreground">COURSERA_CLIENT_ID</span>
                <span className={configStatus.hasClientId ? "text-emerald-500" : "text-amber-500"}>
                  {configStatus.hasClientId ? "✓ Configured (server-only)" : "○ Missing / Placeholder"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border bg-card/60">
                <span className="font-semibold block text-foreground">COURSERA_CLIENT_SECRET</span>
                <span className={configStatus.hasClientSecret ? "text-emerald-500" : "text-amber-500"}>
                  {configStatus.hasClientSecret ? "✓ Configured (server-only)" : "○ Missing / Placeholder"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg border bg-card/60">
                <span className="font-semibold block text-foreground">COURSERA_ORG_ID</span>
                <span className={configStatus.hasOrgId ? "text-emerald-500" : "text-muted-foreground"}>
                  {configStatus.hasOrgId ? "✓ Configured" : "○ Optional"}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              To connect live enterprise APIs, configure these credentials in your deployment environment or <code className="bg-muted px-1 py-0.5 rounded">.env.local</code>.
              When not set, Placement Hub serves verified, direct coursera.org course links so students can enroll seamlessly without interruption.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-border/80 space-x-2">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center space-x-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "catalog"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Explore Catalog ({initialCourses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("my-learning")}
          className={`flex items-center space-x-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors relative ${
            activeTab === "my-learning"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookmarkCheck className="h-4 w-4" />
          <span>My Learning Progress</span>
          {savedCourses.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {savedCourses.length}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("recommended")}
          className={`flex items-center space-x-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "recommended"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>Recommended For You ({recommendedCourses.length})</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: EXPLORE CATALOG */}
      {/* ==================================================================== */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          {/* Search & Difficulty Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search courses, skills (e.g. React, Python, Cloud), or instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="h-10 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="All">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-1.5">
            {COURSERA_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Catalog Course Cards Grid */}
          {filteredCourses.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-semibold">No courses found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No Coursera courses match your search or filter criteria. Try clearing your search or selecting a different category.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Categories");
                  setSelectedDifficulty("All");
                }}
                className="mt-4 text-xs"
              >
                Reset Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCourses.map((course) => {
                const saved = savedMap.get(course.id);
                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    savedCourse={saved}
                    onSave={() => handleSaveCourse(course)}
                    onRemove={() => handleRemoveCourse(course.id, course.title)}
                    onStatusChange={(s) => handleStatusChange(course.id, s)}
                    isPending={isPending}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: MY LEARNING PROGRESS */}
      {/* ==================================================================== */}
      {activeTab === "my-learning" && (
        <div className="space-y-6">
          {/* Progress Analytics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 bg-card/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Enrolled</span>
                <Bookmark className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold mt-1 text-foreground">{savedCourses.length}</p>
              <span className="text-[11px] text-muted-foreground">Self-tracked courses</span>
            </Card>

            <Card className="p-4 bg-card/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">In Progress</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{inProgressCount}</p>
              <span className="text-[11px] text-muted-foreground">Active study</span>
            </Card>

            <Card className="p-4 bg-card/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Completed</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{completedCount}</p>
              <span className="text-[11px] text-muted-foreground">Finished coursework</span>
            </Card>

            <Card className="p-4 bg-card/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Skills Targeted</span>
                <Layers className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-2xl font-bold mt-1 text-indigo-600 dark:text-indigo-400">
                {uniqueSkillsTracked.length}
              </p>
              <span className="text-[11px] text-muted-foreground">Competencies</span>
            </Card>
          </div>

          {/* Filter Pills for Saved Courses */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {["All", "Saved", "In Progress", "Completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setLearningFilter(status)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    learningFilter === status
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("catalog")}
              className="text-xs h-8"
            >
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              Browse More Courses
            </Button>
          </div>

          {/* Saved Courses List */}
          {filteredSavedCourses.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Bookmark className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-semibold">No courses in this list</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {savedCourses.length === 0
                  ? "You haven't saved any courses to your skill development plan yet. Explore the Coursera catalog and save courses to track your preparation."
                  : `You don't have any courses marked as "${learningFilter}".`}
              </p>
              <Button
                size="sm"
                onClick={() => setActiveTab("catalog")}
                className="mt-4 text-xs"
              >
                Explore Coursera Catalog
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSavedCourses.map((saved) => (
                <SavedCourseCard
                  key={saved.id}
                  savedCourse={saved}
                  onStatusChange={(s) => handleStatusChange(saved.course_id, s)}
                  onRemove={() => handleRemoveCourse(saved.course_id, saved.title)}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: RECOMMENDED FOR YOU */}
      {/* ==================================================================== */}
      {activeTab === "recommended" && (
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20 p-5">
            <div className="flex items-start space-x-3">
              <Sparkles className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Personalized Learning Recommendations
                </h3>
                <p className="text-xs text-muted-foreground">
                  These courses are tailored to your recorded technical skills (
                  {studentSkills.length > 0 ? studentSkills.slice(0, 5).join(", ") : "general curriculum"}
                  ) and target roles to maximize your shortlist probability in campus drives.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendedCourses.map((course) => {
              const saved = savedMap.get(course.id);
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  savedCourse={saved}
                  onSave={() => handleSaveCourse(course)}
                  onRemove={() => handleRemoveCourse(course.id, course.title)}
                  onStatusChange={(s) => handleStatusChange(course.id, s)}
                  isPending={isPending}
                  badgeText="Recommended"
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Course Card (Catalog View)
// -----------------------------------------------------------------------------
function CourseCard({
  course,
  savedCourse,
  onSave,
  onRemove,
  onStatusChange,
  isPending,
  badgeText,
}: {
  course: CourseraCourse;
  savedCourse?: StudentSavedCourse;
  onSave: () => void;
  onRemove: () => void;
  onStatusChange: (status: SavedCourseStatus) => void;
  isPending: boolean;
  badgeText?: string;
}) {
  return (
    <Card className="flex flex-col justify-between overflow-hidden border-border/80 hover:border-primary/40 transition-all hover:shadow-md bg-card">
      <div>
        {/* Card Header & Badges */}
        <div className="p-4 pb-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
              {course.category}
            </Badge>
            <div className="flex items-center space-x-1.5">
              {badgeText && (
                <Badge variant="default" className="text-[10px] bg-amber-600 hover:bg-amber-600">
                  {badgeText}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={`text-[10px] ${
                  course.difficulty === "Beginner"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : course.difficulty === "Intermediate"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                }`}
              >
                {course.difficulty}
              </Badge>
            </div>
          </div>

          <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium text-foreground/80 truncate">{course.partner_name}</span>
          </div>
        </div>

        {/* Card Description */}
        <div className="px-4 py-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {course.description}
        </div>

        {/* Skills Tag Pills */}
        <div className="px-4 py-2 flex flex-wrap gap-1">
          {course.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="text-[10px] rounded-md bg-muted px-2 py-0.5 text-muted-foreground"
            >
              {skill}
            </span>
          ))}
          {course.skills.length > 4 && (
            <span className="text-[10px] text-muted-foreground self-center">
              +{course.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-4 pt-3 border-t border-border/60 bg-muted/20 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center text-[11px]">
            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
            {course.duration}
          </span>
          <span className="text-[10px] font-medium text-primary">Coursera</span>
        </div>

        <div className="flex items-center gap-2">
          {/* External Link to Coursera */}
          <a
            href={course.course_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="default" size="sm" className="w-full text-xs h-8">
              <span>View on Coursera</span>
              <ExternalLink className="h-3 w-3 ml-1.5" />
            </Button>
          </a>

          {/* Save / Status Action */}
          {savedCourse ? (
            <select
              value={savedCourse.status}
              onChange={(e) => onStatusChange(e.target.value as SavedCourseStatus)}
              disabled={isPending}
              className="h-8 rounded-md border border-input bg-card px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring shrink-0 text-foreground"
            >
              <option value="Saved">Saved</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isPending}
              className="h-8 text-xs shrink-0"
              title="Add to My Learning"
            >
              <Bookmark className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Saved Course Card (Learning Progress View)
// -----------------------------------------------------------------------------
function SavedCourseCard({
  savedCourse,
  onStatusChange,
  onRemove,
  isPending,
}: {
  savedCourse: StudentSavedCourse;
  onStatusChange: (status: SavedCourseStatus) => void;
  onRemove: () => void;
  isPending: boolean;
}) {
  return (
    <Card className="flex flex-col justify-between overflow-hidden border-border/80 hover:shadow-md bg-card">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={`text-[10px] font-semibold ${
              savedCourse.status === "Completed"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : savedCourse.status === "In Progress"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
            }`}
          >
            {savedCourse.status === "Completed" && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
            {savedCourse.status === "In Progress" && <Clock className="h-3 w-3 mr-1 inline" />}
            {savedCourse.status === "Saved" && <Bookmark className="h-3 w-3 mr-1 inline" />}
            {savedCourse.status}
          </Badge>

          {savedCourse.difficulty && (
            <span className="text-[10px] text-muted-foreground">{savedCourse.difficulty}</span>
          )}
        </div>

        <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground">
          {savedCourse.title}
        </h3>

        {savedCourse.partner_name && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{savedCourse.partner_name}</span>
          </div>
        )}

        {/* Skills */}
        {savedCourse.skills && savedCourse.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {savedCourse.skills.slice(0, 3).map((s) => (
              <span key={s} className="text-[10px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Progress Switcher & Direct Link */}
      <div className="p-4 pt-3 border-t border-border/60 bg-muted/20 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Status</span>
          <select
            value={savedCourse.status}
            onChange={(e) => onStatusChange(e.target.value as SavedCourseStatus)}
            disabled={isPending}
            className="h-7 rounded border border-input bg-card px-2 text-xs focus:outline-none"
          >
            <option value="Saved">Saved</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={savedCourse.course_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="default" size="sm" className="w-full text-xs h-8">
              <span>Continue on Coursera</span>
              <ExternalLink className="h-3 w-3 ml-1.5" />
            </Button>
          </a>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={isPending}
            className="h-8 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            title="Remove from saved"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
