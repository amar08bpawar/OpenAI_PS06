import { z } from "zod";

export const ResumeContactSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().default(""),
  location: z.string().default(""),
  linkedinUrl: z.string().default(""),
  githubUrl: z.string().default(""),
  portfolioUrl: z.string().default(""),
});

export const ResumeEducationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, "Institution name is required"),
  degree: z.string().min(1, "Degree/Course is required"),
  fieldOfStudy: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  cgpaOrMarks: z.string().default(""),
});

export const ResumeExperienceSchema = z.object({
  id: z.string(),
  role: z.string().min(1, "Role is required"),
  company: z.string().min(1, "Company name is required"),
  location: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  current: z.boolean().default(false),
  description: z.string().default(""),
});

export const ResumeProjectSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Project title is required"),
  subtitle: z.string().default(""),
  techStack: z.array(z.string()).default([]),
  link: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  description: z.string().default(""),
});

export const ResumeCertificationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().min(1, "Issuing organization is required"),
  issueDate: z.string().default(""),
  credentialUrl: z.string().default(""),
});

export const ResumeAchievementSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Achievement title is required"),
  organization: z.string().default(""),
  date: z.string().default(""),
  description: z.string().default(""),
});

export const ResumeSkillsSchema = z.object({
  technical: z.array(z.string()).default([]),
  soft: z.array(z.string()).default([]),
  toolsAndFrameworks: z.array(z.string()).default([]),
});

export const ResumeDataSchema = z.object({
  contact: ResumeContactSchema,
  summary: z.string().default(""),
  education: z.array(ResumeEducationSchema).default([]),
  skills: ResumeSkillsSchema,
  projects: z.array(ResumeProjectSchema).default([]),
  experience: z.array(ResumeExperienceSchema).default([]),
  certifications: z.array(ResumeCertificationSchema).default([]),
  achievements: z.array(ResumeAchievementSchema).default([]),
});

export type ResumeContact = z.infer<typeof ResumeContactSchema>;
export type ResumeEducation = z.infer<typeof ResumeEducationSchema>;
export type ResumeExperience = z.infer<typeof ResumeExperienceSchema>;
export type ResumeProject = z.infer<typeof ResumeProjectSchema>;
export type ResumeCertification = z.infer<typeof ResumeCertificationSchema>;
export type ResumeAchievement = z.infer<typeof ResumeAchievementSchema>;
export type ResumeSkills = z.infer<typeof ResumeSkillsSchema>;
export type ResumeData = z.infer<typeof ResumeDataSchema>;

export type ResumeTemplateId = "modern" | "classic" | "minimal";

export interface ResumeRecord {
  id: string;
  student_id: string;
  title: string;
  template_id: ResumeTemplateId;
  data: ResumeData;
  is_primary: boolean;
  file_url?: string | null;
  created_at: string;
  updated_at: string;
}

export const defaultResumeData: ResumeData = {
  contact: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
  },
  summary: "",
  education: [],
  skills: {
    technical: [],
    soft: [],
    toolsAndFrameworks: [],
  },
  projects: [],
  experience: [],
  certifications: [],
  achievements: [],
};
