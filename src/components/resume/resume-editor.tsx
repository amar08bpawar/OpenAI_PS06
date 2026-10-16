"use client";

import React, { useState } from "react";
import {
  User,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Award,
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Wrench,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResumeData } from "@/types/resume";
import { AIRewriteModal } from "./ai-rewrite-modal";

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export function ResumeEditor({ data, onChange }: ResumeEditorProps) {
  // Active accordion section
  const [activeSection, setActiveSection] = useState<string>("contact");

  // State for AI modal
  const [aiModalState, setAiModalState] = useState<{
    isOpen: boolean;
    section: "summary" | "project" | "experience";
    originalText: string;
    onApply: (text: string) => void;
  }>({
    isOpen: false,
    section: "summary",
    originalText: "",
    onApply: () => {},
  });

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? "" : id);
  };

  // Contact update helper
  const handleContactChange = (field: keyof ResumeData["contact"], value: string) => {
    onChange({
      ...data,
      contact: {
        ...data.contact,
        [field]: value,
      },
    });
  };

  // Education handlers
  const addEducation = () => {
    const newEdu = {
      id: `edu-${Date.now()}`,
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      cgpaOrMarks: "",
    };
    onChange({
      ...data,
      education: [...data.education, newEdu],
    });
  };

  const removeEducation = (id: string) => {
    onChange({
      ...data,
      education: data.education.filter((e) => e.id !== id),
    });
  };

  const updateEducation = (id: string, field: string, value: string) => {
    onChange({
      ...data,
      education: data.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    });
  };

  // Experience handlers
  const addExperience = () => {
    const newExp = {
      id: `exp-${Date.now()}`,
      role: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    };
    onChange({
      ...data,
      experience: [...data.experience, newExp],
    });
  };

  const removeExperience = (id: string) => {
    onChange({
      ...data,
      experience: data.experience.filter((e) => e.id !== id),
    });
  };

  const updateExperience = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      experience: data.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    });
  };

  // Project handlers
  const addProject = () => {
    const newProj = {
      id: `proj-${Date.now()}`,
      title: "",
      subtitle: "",
      techStack: [],
      link: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    onChange({
      ...data,
      projects: [...data.projects, newProj],
    });
  };

  const removeProject = (id: string) => {
    onChange({
      ...data,
      projects: data.projects.filter((p) => p.id !== id),
    });
  };

  const updateProject = (id: string, field: string, value: any) => {
    onChange({
      ...data,
      projects: data.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    });
  };

  // Certification handlers
  const addCertification = () => {
    const newCert = {
      id: `cert-${Date.now()}`,
      name: "",
      issuer: "",
      issueDate: "",
      credentialUrl: "",
    };
    onChange({
      ...data,
      certifications: [...data.certifications, newCert],
    });
  };

  const removeCertification = (id: string) => {
    onChange({
      ...data,
      certifications: data.certifications.filter((c) => c.id !== id),
    });
  };

  const updateCertification = (id: string, field: string, value: string) => {
    onChange({
      ...data,
      certifications: data.certifications.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    });
  };

  // Achievement handlers
  const addAchievement = () => {
    const newAch = {
      id: `ach-${Date.now()}`,
      title: "",
      organization: "",
      date: "",
      description: "",
    };
    onChange({
      ...data,
      achievements: [...data.achievements, newAch],
    });
  };

  const removeAchievement = (id: string) => {
    onChange({
      ...data,
      achievements: data.achievements.filter((a) => a.id !== id),
    });
  };

  const updateAchievement = (id: string, field: string, value: string) => {
    onChange({
      ...data,
      achievements: data.achievements.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    });
  };

  // Skills handlers
  const handleSkillsChange = (type: "technical" | "soft" | "toolsAndFrameworks", text: string) => {
    const parsed = text
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({
      ...data,
      skills: {
        ...data.skills,
        [type]: parsed,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Contact Information */}
      <div className="border border-border rounded-xl bg-card overflow-hidden transition-all shadow-sm">
        <button
          onClick={() => toggleSection("contact")}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Contact & Personal Details</h4>
              <p className="text-xs text-muted-foreground">Name, email, phone, location & profiles</p>
            </div>
          </div>
          {activeSection === "contact" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {activeSection === "contact" && (
          <div className="p-5 pt-0 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Alex Johnson"
                value={data.contact.fullName}
                onChange={(e) => handleContactChange("fullName", e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Email Address *</label>
              <input
                type="email"
                placeholder="alex.johnson@example.com"
                value={data.contact.email}
                onChange={(e) => handleContactChange("email", e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={data.contact.phone}
                onChange={(e) => handleContactChange("phone", e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Location</label>
              <input
                type="text"
                placeholder="City, State / Country"
                value={data.contact.location}
                onChange={(e) => handleContactChange("location", e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">LinkedIn Profile</label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={data.contact.linkedinUrl || ""}
                onChange={(e) => handleContactChange("linkedinUrl", e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">GitHub Profile</label>
              <input
                type="url"
                placeholder="https://github.com/username"
                value={data.contact.githubUrl || ""}
                onChange={(e) => handleContactChange("githubUrl", e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-foreground block mb-1">Portfolio / Personal Site</label>
              <input
                type="url"
                placeholder="https://alexjohnson.dev"
                value={data.contact.portfolioUrl || ""}
                onChange={(e) => handleContactChange("portfolioUrl", e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Professional Summary */}
      <div className="border border-border rounded-xl bg-card overflow-hidden transition-all shadow-sm">
        <button
          onClick={() => toggleSection("summary")}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Professional Summary</h4>
              <p className="text-xs text-muted-foreground">High-impact introductory statement</p>
            </div>
          </div>
          {activeSection === "summary" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {activeSection === "summary" && (
          <div className="p-5 pt-0 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                Career Summary / Objective
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
                onClick={() =>
                  setAiModalState({
                    isOpen: true,
                    section: "summary",
                    originalText: data.summary,
                    onApply: (text) => onChange({ ...data, summary: text }),
                  })
                }
              >
                <Sparkles className="h-3 w-3" />
                AI Polish
              </Button>
            </div>
            <textarea
              rows={4}
              placeholder="e.g. Computer Science senior with experience in React, Node.js, and distributed microservices. Proven problem solver passionate about building scalable, high-performance web products..."
              value={data.summary}
              onChange={(e) => onChange({ ...data, summary: e.target.value })}
              className="w-full text-xs p-3 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* 3. Education */}
      <div className="border border-border rounded-xl bg-card overflow-hidden transition-all shadow-sm">
        <button
          onClick={() => toggleSection("education")}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">
                Education ({data.education.length})
              </h4>
              <p className="text-xs text-muted-foreground">College, degree, branch, marks / CGPA</p>
            </div>
          </div>
          {activeSection === "education" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {activeSection === "education" && (
          <div className="p-5 pt-0 border-t border-border space-y-4">
            {data.education.map((edu, idx) => (
              <div key={edu.id} className="p-4 rounded-lg bg-muted/30 border border-border space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Education #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEducation(edu.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-foreground block mb-1">
                      Institution / University *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. National Institute of Technology"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground block mb-1">
                      Degree / Qualification *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. B.Tech Computer Science"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground block mb-1">
                      Field / Branch
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Information Technology"
                      value={edu.fieldOfStudy || ""}
                      onChange={(e) => updateEducation(edu.id, "fieldOfStudy", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground block mb-1">
                      Marks / CGPA
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CGPA: 8.8 / 10.0"
                      value={edu.cgpaOrMarks || ""}
                      onChange={(e) => updateEducation(edu.id, "cgpaOrMarks", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground block mb-1">Start Date</label>
                    <input
                      type="text"
                      placeholder="e.g. 2021"
                      value={edu.startDate || ""}
                      onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground block mb-1">
                      End Date / Passing Year
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2025 (Expected)"
                      value={edu.endDate || ""}
                      onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEducation}
              className="w-full border-dashed gap-1.5 text-xs py-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Education Entry
            </Button>
          </div>
        )}
      </div>

      {/* 4. Skills & Competencies */}
      <div className="border border-border rounded-xl bg-card overflow-hidden transition-all shadow-sm">
        <button
          onClick={() => toggleSection("skills")}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Skills & Toolbox</h4>
              <p className="text-xs text-muted-foreground">Technical, frameworks, tools & soft skills</p>
            </div>
          </div>
          {activeSection === "skills" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {activeSection === "skills" && (
          <div className="p-5 pt-0 border-t border-border space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Technical Skills (Languages & Libraries)
              </label>
              <p className="text-[11px] text-muted-foreground mb-1.5">
                Comma or line separated (e.g. JavaScript, TypeScript, Python, React, Next.js, Node.js)
              </p>
              <textarea
                rows={2}
                value={data.skills.technical.join(", ")}
                onChange={(e) => handleSkillsChange("technical", e.target.value)}
                placeholder="JavaScript, TypeScript, React, Node.js, Python, PostgreSQL"
                className="w-full text-xs p-2.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Developer Tools, Databases & Platforms
              </label>
              <p className="text-[11px] text-muted-foreground mb-1.5">
                Comma separated (e.g. Git, Docker, Supabase, AWS, Redis, Postman)
              </p>
              <textarea
                rows={2}
                value={data.skills.toolsAndFrameworks.join(", ")}
                onChange={(e) => handleSkillsChange("toolsAndFrameworks", e.target.value)}
                placeholder="Git, Docker, Supabase, Linux, VS Code, Figma"
                className="w-full text-xs p-2.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Soft Skills & Professional Attributes
              </label>
              <p className="text-[11px] text-muted-foreground mb-1.5">
                Comma separated (e.g. Agile Collaboration, Problem Solving, Cross-functional Communication)
              </p>
              <textarea
                rows={2}
                value={data.skills.soft.join(", ")}
                onChange={(e) => handleSkillsChange("soft", e.target.value)}
                placeholder="Problem Solving, Agile Workflow, Technical Communication, Team Leadership"
                className="w-full text-xs p-2.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Experience / Internships */}
      <div className="border border-border rounded-xl bg-card overflow-hidden transition-all shadow-sm">
        <button
          onClick={() => toggleSection("experience")}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">
                Work Experience & Internships ({data.experience.length})
              </h4>
              <p className="text-xs text-muted-foreground">Previous jobs, internships, freelance roles</p>
            </div>
          </div>
          {activeSection === "experience" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {activeSection === "experience" && (
          <div className="p-5 pt-0 border-t border-border space-y-4">
            {data.experience.map((exp, idx) => (
              <div key={exp.id} className="p-4 rounded-lg bg-muted/30 border border-border space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Experience #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-foreground block mb-1">
                      Job / Intern Role *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Software Development Intern"
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground block mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Tech Labs"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground block mb-1">
                      Start Date
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jun 2024"
                      value={exp.startDate || ""}
                      onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground block mb-1">
                      End Date
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aug 2024"
                      value={exp.endDate || ""}
                      disabled={exp.current}
                      onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-foreground">
                      Responsibilities & Impact (Bullets recommended)
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] gap-1 text-primary border-primary/30 hover:bg-primary/5"
                      onClick={() =>
                        setAiModalState({
                          isOpen: true,
                          section: "experience",
                          originalText: exp.description,
                          onApply: (text) => updateExperience(exp.id, "description", text),
                        })
                      }
                    >
                      <Sparkles className="h-3 w-3" />
                      AI Action Verbs
                    </Button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="• Built automated CI/CD pipeline reducing release cycle times.&#10;• Collaborated with senior engineers to implement user authentication."
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                    className="w-full text-xs p-2.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addExperience}
              className="w-full border-dashed gap-1.5 text-xs py-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Experience Entry
            </Button>
          </div>
        )}
      </div>

      {/* 6. Projects */}
      <div className="border border-border rounded-xl bg-card overflow-hidden transition-all shadow-sm">
        <button
          onClick={() => toggleSection("projects")}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <FolderGit2 className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">
                Featured Projects ({data.projects.length})
              </h4>
              <p className="text-xs text-muted-foreground">Technical accomplishments, GitHub links & stacks</p>
            </div>
          </div>
          {activeSection === "projects" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {activeSection === "projects" && (
          <div className="p-5 pt-0 border-t border-border space-y-4">
            {data.projects.map((proj, idx) => (
              <div key={proj.id} className="p-4 rounded-lg bg-muted/30 border border-border space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Project #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProject(proj.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-foreground block mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Distributed Task Scheduler"
                      value={proj.title}
                      onChange={(e) => updateProject(proj.id, "title", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-foreground block mb-1">
                      Live / GitHub URL
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. github.com/user/project"
                      value={proj.link || ""}
                      onChange={(e) => updateProject(proj.id, "link", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-medium text-foreground block mb-1">
                      Tech Stack (Comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. React, TypeScript, Redis, Docker, PostgreSQL"
                      value={proj.techStack.join(", ")}
                      onChange={(e) =>
                        updateProject(
                          proj.id,
                          "techStack",
                          e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-foreground">
                      Description & Deliverables (Bullets recommended)
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] gap-1 text-primary border-primary/30 hover:bg-primary/5"
                      onClick={() =>
                        setAiModalState({
                          isOpen: true,
                          section: "project",
                          originalText: proj.description,
                          onApply: (text) => updateProject(proj.id, "description", text),
                        })
                      }
                    >
                      <Sparkles className="h-3 w-3" />
                      AI Action Verbs
                    </Button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="• Architected an asynchronous job queue processing 10,000 requests/sec.&#10;• Implemented Redis caching layer reducing database query overhead by 40%."
                    value={proj.description}
                    onChange={(e) => updateProject(proj.id, "description", e.target.value)}
                    className="w-full text-xs p-2.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addProject}
              className="w-full border-dashed gap-1.5 text-xs py-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Project Entry
            </Button>
          </div>
        )}
      </div>

      {/* 7. Certifications */}
      <div className="border border-border rounded-xl bg-card overflow-hidden transition-all shadow-sm">
        <button
          onClick={() => toggleSection("certifications")}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">
                Certifications ({data.certifications.length})
              </h4>
              <p className="text-xs text-muted-foreground">AWS, Azure, Coursera, HackerRank credentials</p>
            </div>
          </div>
          {activeSection === "certifications" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {activeSection === "certifications" && (
          <div className="p-5 pt-0 border-t border-border space-y-4">
            {data.certifications.map((cert, idx) => (
              <div key={cert.id} className="p-3 rounded-lg bg-muted/30 border border-border grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-medium text-foreground block mb-1">Cert Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. AWS Certified Developer"
                    value={cert.name}
                    onChange={(e) => updateCertification(cert.id, "name", e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-foreground block mb-1">Issuer *</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon Web Services"
                    value={cert.issuer}
                    onChange={(e) => updateCertification(cert.id, "issuer", e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-medium text-foreground block mb-1">Issue Date</label>
                    <input
                      type="text"
                      placeholder="e.g. 2024"
                      value={cert.issueDate || ""}
                      onChange={(e) => updateCertification(cert.id, "issueDate", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCertification(cert.id)}
                    className="text-muted-foreground hover:text-destructive p-2 rounded transition-colors mb-0.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCertification}
              className="w-full border-dashed gap-1.5 text-xs py-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Certification
            </Button>
          </div>
        )}
      </div>

      {/* 8. Achievements */}
      <div className="border border-border rounded-xl bg-card overflow-hidden transition-all shadow-sm">
        <button
          onClick={() => toggleSection("achievements")}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">
                Achievements & Honors ({data.achievements.length})
              </h4>
              <p className="text-xs text-muted-foreground">Hackathons, coding ranks, scholastic honors</p>
            </div>
          </div>
          {activeSection === "achievements" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {activeSection === "achievements" && (
          <div className="p-5 pt-0 border-t border-border space-y-4">
            {data.achievements.map((ach, idx) => (
              <div key={ach.id} className="p-3 rounded-lg bg-muted/30 border border-border grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-foreground block mb-1">
                    Honor / Award Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Place - University Hackathon 2024"
                    value={ach.title}
                    onChange={(e) => updateAchievement(ach.id, "title", e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-medium text-foreground block mb-1">Date</label>
                    <input
                      type="text"
                      placeholder="e.g. Nov 2024"
                      value={ach.date || ""}
                      onChange={(e) => updateAchievement(ach.id, "date", e.target.value)}
                      className="w-full text-xs px-3 py-1.5 border rounded-md bg-background border-input text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAchievement(ach.id)}
                    className="text-muted-foreground hover:text-destructive p-2 rounded transition-colors mb-0.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAchievement}
              className="w-full border-dashed gap-1.5 text-xs py-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Achievement
            </Button>
          </div>
        )}
      </div>

      {/* AI Rewrite Modal */}
      <AIRewriteModal
        isOpen={aiModalState.isOpen}
        onClose={() => setAiModalState({ ...aiModalState, isOpen: false })}
        section={aiModalState.section}
        originalText={aiModalState.originalText}
        onApply={aiModalState.onApply}
      />
    </div>
  );
}
