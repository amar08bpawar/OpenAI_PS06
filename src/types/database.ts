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

export interface StudentDetails {
  id: string;
  user_id: string;
  course: string;
  qualification: string;
  branch?: string | null;
  graduation_year?: number | null;
  cgpa?: number | null;
  github_username?: string | null;
  skills: string[];
  resume_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecruiterMembership {
  id: string;
  user_id: string;
  company_name: string;
  designation?: string | null;
  company_website?: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
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
