export type UserRole = "student" | "recruiter" | "administrator";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectItem {
  id?: string;
  title: string;
  description: string;
  tech_stack: string[];
  link?: string;
}

export interface ExperienceItem {
  id?: string;
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface StudentDetails {
  id: string;
  user_id: string;
  college?: string;
  course: string;
  qualification: string;
  branch?: string | null;
  graduation_year?: number | null;
  cgpa?: number | null;
  github_username?: string | null;
  skills: string[]; // technical skills
  soft_skills?: string[];
  projects?: ProjectItem[];
  experience?: ExperienceItem[];
  phone?: string;
  linkedin_url?: string;
  resume_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecruiterMembership {
  id: string;
  user_id: string;
  company_name: string;
  company_id?: string | null;
  designation?: string | null;
  company_website?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string | null;
  description?: string | null;
  location: string;
  industry: string;
  website?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  created_by?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export type WorkMode = "On-site" | "Remote" | "Hybrid";
export type ListingStatus = "draft" | "pending_approval" | "published" | "closed";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Job {
  id: string;
  company_id: string;
  recruiter_id: string;
  title: string;
  description: string;
  salary_package: string;
  location: string;
  work_mode: WorkMode;
  required_skills: string[];
  min_cgpa: number;
  eligible_qualifications: string[];
  eligible_courses: string[];
  eligible_graduation_years: number[];
  application_deadline: string;
  selection_process?: string | null;
  status: ListingStatus;
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at: string;
  // Joins
  company?: Company;
}

export interface Internship {
  id: string;
  company_id: string;
  recruiter_id: string;
  title: string;
  description: string;
  stipend: string;
  duration: string;
  location: string;
  work_mode: WorkMode;
  required_skills: string[];
  min_cgpa: number;
  eligible_qualifications: string[];
  eligible_courses: string[];
  eligible_graduation_years: number[];
  application_deadline: string;
  status: ListingStatus;
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at: string;
  // Joins
  company?: Company;
}

export type ApplicationStatus =
  | "Applied"
  | "Shortlisted"
  | "Interview"
  | "Selected"
  | "Rejected"
  | "Withdrawn";

export type ApplicationType = "job" | "internship";

export interface Application {
  id: string;
  student_id: string;
  job_id?: string | null;
  internship_id?: string | null;
  type: ApplicationType;
  status: ApplicationStatus;
  notes?: string | null;
  applied_at: string;
  updated_at: string;
  // Joins
  job?: Job;
  internship?: Internship;
  student?: Profile;
  student_details?: StudentDetails;
}

export type AptitudeCategory =
  | "logical"
  | "quantitative"
  | "mathematics"
  | "verbal"
  | "problem_solving"
  | "technical";

export type AptitudeDifficulty = "beginner" | "intermediate" | "advanced";

export interface AptitudeTest {
  id: string;
  title: string;
  category: AptitudeCategory;
  difficulty: AptitudeDifficulty;
  description?: string | null;
  time_limit_minutes: number;
  total_questions: number;
  is_generated: boolean;
  created_at: string;
}

export interface AptitudeQuestion {
  id: string;
  test_id: string;
  question_text: string;
  options: string[];
  correct_option: number; // 0 to 3, server-side only
  explanation: string;
  order_index: number;
  created_at: string;
}

export interface PublicAptitudeQuestion {
  id: string;
  test_id: string;
  question_text: string;
  options: string[];
  order_index: number;
}

export interface AptitudeAttempt {
  id: string;
  student_id: string;
  test_id: string;
  score: number;
  total_questions: number;
  correct_count: number;
  time_spent_seconds: number;
  user_answers: Record<string, number>;
  passed: boolean;
  created_at: string;
  test?: AptitudeTest;
}

export type InterviewCategory =
  | "hr"
  | "technical"
  | "communication"
  | "teamwork"
  | "mock";

export interface InterviewMessage {
  role: "assistant" | "user";
  content: string;
  timestamp: string;
  feedback?: string | null;
}

export interface InterviewSession {
  id: string;
  student_id: string;
  category: InterviewCategory;
  role_target: string;
  messages: InterviewMessage[];
  overall_feedback?: string | null;
  status: "active" | "completed";
  created_at: string;
  updated_at: string;
}

export interface CareerGuidanceAnalysis {
  skills_matched: string[];
  skills_gap: string[];
  readiness_score: number; // 0 - 100
  recommended_learning_plan: {
    skill: string;
    action: string;
    resources: string[];
  }[];
  milestones: string[];
  advice: string;
  is_data_sufficient: boolean;
  insufficient_reason?: string | null;
}

export interface CareerGuidanceReport {
  id: string;
  student_id: string;
  target_role: string;
  analysis: CareerGuidanceAnalysis;
  created_at: string;
}

export interface StudentGitHubEvidence {
  student_id: string;
  username: string;
  public_repos_count: number;
  total_stars: number;
  languages: Record<string, { bytes: number; percentage: number }>;
  top_repos: {
    name: string;
    description: string | null;
    html_url: string;
    stars: number;
    forks: number;
    primary_language: string | null;
  }[];
  last_fetched_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      student_details: {
        Row: StudentDetails;
        Insert: Partial<StudentDetails>;
        Update: Partial<StudentDetails>;
        Relationships: [];
      };
      recruiter_memberships: {
        Row: RecruiterMembership;
        Insert: Partial<RecruiterMembership>;
        Update: Partial<RecruiterMembership>;
        Relationships: [];
      };
      companies: {
        Row: Company;
        Insert: Partial<Company>;
        Update: Partial<Company>;
        Relationships: [];
      };
      jobs: {
        Row: Job;
        Insert: Partial<Job>;
        Update: Partial<Job>;
        Relationships: [];
      };
      internships: {
        Row: Internship;
        Insert: Partial<Internship>;
        Update: Partial<Internship>;
        Relationships: [];
      };
      applications: {
        Row: Application;
        Insert: Partial<Application>;
        Update: Partial<Application>;
        Relationships: [];
      };
      aptitude_tests: {
        Row: AptitudeTest;
        Insert: Partial<AptitudeTest>;
        Update: Partial<AptitudeTest>;
        Relationships: [];
      };
      aptitude_questions: {
        Row: AptitudeQuestion;
        Insert: Partial<AptitudeQuestion>;
        Update: Partial<AptitudeQuestion>;
        Relationships: [];
      };
      aptitude_attempts: {
        Row: AptitudeAttempt;
        Insert: Partial<AptitudeAttempt>;
        Update: Partial<AptitudeAttempt>;
        Relationships: [];
      };
      interview_sessions: {
        Row: InterviewSession;
        Insert: Partial<InterviewSession>;
        Update: Partial<InterviewSession>;
        Relationships: [];
      };
      career_guidance_reports: {
        Row: CareerGuidanceReport;
        Insert: Partial<CareerGuidanceReport>;
        Update: Partial<CareerGuidanceReport>;
        Relationships: [];
      };
      student_github_evidence: {
        Row: StudentGitHubEvidence;
        Insert: Partial<StudentGitHubEvidence>;
        Update: Partial<StudentGitHubEvidence>;
        Relationships: [];
      };
      resumes: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
