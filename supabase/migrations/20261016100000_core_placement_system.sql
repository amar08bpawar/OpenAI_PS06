-- ==============================================================================
-- Placement Hub - Supabase Migration: Core Placement Management System
-- Migration: 20261016100000_core_placement_system.sql
-- Description: Adds companies, jobs, internships, applications, enhanced
-- student profile fields, duplicate application constraints, and strict RLS.
-- ==============================================================================

-- 1. Enhance student_details with comprehensive profile fields
ALTER TABLE public.student_details
    ADD COLUMN IF NOT EXISTS college TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS soft_skills TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT '';

-- 2. Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    location TEXT NOT NULL DEFAULT '',
    industry TEXT NOT NULL DEFAULT '',
    website TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_location ON public.companies(location);
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);

-- Link recruiter_memberships to companies if not already linked
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recruiter_memberships' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE public.recruiter_memberships
            ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    salary_package TEXT NOT NULL,
    location TEXT NOT NULL,
    work_mode TEXT NOT NULL DEFAULT 'On-site' CHECK (work_mode IN ('On-site', 'Remote', 'Hybrid')),
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    min_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 0.0 CHECK (min_cgpa >= 0.0 AND min_cgpa <= 10.0),
    eligible_qualifications TEXT[] NOT NULL DEFAULT '{}',
    eligible_courses TEXT[] NOT NULL DEFAULT '{}',
    eligible_graduation_years INT[] NOT NULL DEFAULT '{}',
    application_deadline TIMESTAMPTZ NOT NULL,
    selection_process TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'pending_approval', 'published', 'closed')),
    approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON public.jobs(application_deadline);
CREATE INDEX IF NOT EXISTS idx_jobs_required_skills ON public.jobs USING GIN (required_skills);

-- 4. Internships Table
CREATE TABLE IF NOT EXISTS public.internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    stipend TEXT NOT NULL,
    duration TEXT NOT NULL DEFAULT '3 Months',
    location TEXT NOT NULL,
    work_mode TEXT NOT NULL DEFAULT 'On-site' CHECK (work_mode IN ('On-site', 'Remote', 'Hybrid')),
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    min_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 0.0 CHECK (min_cgpa >= 0.0 AND min_cgpa <= 10.0),
    eligible_qualifications TEXT[] NOT NULL DEFAULT '{}',
    eligible_courses TEXT[] NOT NULL DEFAULT '{}',
    eligible_graduation_years INT[] NOT NULL DEFAULT '{}',
    application_deadline TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'pending_approval', 'published', 'closed')),
    approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_internships_company_id ON public.internships(company_id);
CREATE INDEX IF NOT EXISTS idx_internships_recruiter_id ON public.internships(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_internships_status ON public.internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_deadline ON public.internships(application_deadline);
CREATE INDEX IF NOT EXISTS idx_internships_required_skills ON public.internships USING GIN (required_skills);

-- 5. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'job' CHECK (type IN ('job', 'internship')),
    status TEXT NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'Withdrawn')),
    notes TEXT,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_application_target CHECK (
        (job_id IS NOT NULL AND internship_id IS NULL) OR
        (job_id IS NULL AND internship_id IS NOT NULL)
    ),
    CONSTRAINT uq_student_job_application UNIQUE (student_id, job_id),
    CONSTRAINT uq_student_internship_application UNIQUE (student_id, internship_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_student_id ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_internship_id ON public.applications(internship_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- 6. Updated_at triggers
DROP TRIGGER IF EXISTS set_companies_updated_at ON public.companies;
CREATE TRIGGER set_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_jobs_updated_at ON public.jobs;
CREATE TRIGGER set_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_internships_updated_at ON public.internships;
CREATE TRIGGER set_internships_updated_at
    BEFORE UPDATE ON public.internships
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_applications_updated_at ON public.applications;
CREATE TRIGGER set_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- COMPANIES POLICIES
CREATE POLICY "Anyone can view companies"
    ON public.companies
    FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "Recruiters and admins can create companies"
    ON public.companies
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_recruiter_or_admin()
        AND (created_by IS NULL OR created_by = auth.uid())
    );

CREATE POLICY "Company creators and admins can update companies"
    ON public.companies
    FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.recruiter_memberships rm
            WHERE rm.user_id = auth.uid() AND rm.company_id = public.companies.id AND rm.is_verified = TRUE
        )
    )
    WITH CHECK (
        created_by = auth.uid()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.recruiter_memberships rm
            WHERE rm.user_id = auth.uid() AND rm.company_id = public.companies.id AND rm.is_verified = TRUE
        )
    );

-- JOBS POLICIES
-- Students can view published & approved jobs; Recruiters view own jobs; Admins view all
CREATE POLICY "View published jobs or own jobs"
    ON public.jobs
    FOR SELECT
    TO authenticated
    USING (
        (status = 'published' AND approval_status = 'approved')
        OR recruiter_id = auth.uid()
        OR public.is_admin()
    );

CREATE POLICY "Recruiters and admins can insert jobs"
    ON public.jobs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_recruiter_or_admin()
        AND recruiter_id = auth.uid()
    );

CREATE POLICY "Recruiters can update own jobs, admins update all"
    ON public.jobs
    FOR UPDATE
    TO authenticated
    USING (
        recruiter_id = auth.uid()
        OR public.is_admin()
    )
    WITH CHECK (
        recruiter_id = auth.uid()
        OR public.is_admin()
    );

CREATE POLICY "Recruiters can delete own jobs, admins delete all"
    ON public.jobs
    FOR DELETE
    TO authenticated
    USING (
        recruiter_id = auth.uid()
        OR public.is_admin()
    );

-- INTERNSHIPS POLICIES
CREATE POLICY "View published internships or own internships"
    ON public.internships
    FOR SELECT
    TO authenticated
    USING (
        (status = 'published' AND approval_status = 'approved')
        OR recruiter_id = auth.uid()
        OR public.is_admin()
    );

CREATE POLICY "Recruiters and admins can insert internships"
    ON public.internships
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_recruiter_or_admin()
        AND recruiter_id = auth.uid()
    );

CREATE POLICY "Recruiters can update own internships, admins update all"
    ON public.internships
    FOR UPDATE
    TO authenticated
    USING (
        recruiter_id = auth.uid()
        OR public.is_admin()
    )
    WITH CHECK (
        recruiter_id = auth.uid()
        OR public.is_admin()
    );

CREATE POLICY "Recruiters can delete own internships, admins delete all"
    ON public.internships
    FOR DELETE
    TO authenticated
    USING (
        recruiter_id = auth.uid()
        OR public.is_admin()
    );

-- APPLICATIONS POLICIES
-- Students view only their own applications.
-- Recruiters view applications for their own posted jobs/internships.
-- Admins view all.
CREATE POLICY "Students view own applications, recruiters view their job applicants"
    ON public.applications
    FOR SELECT
    TO authenticated
    USING (
        student_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.jobs j
            WHERE j.id = public.applications.job_id AND j.recruiter_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.internships i
            WHERE i.id = public.applications.internship_id AND i.recruiter_id = auth.uid()
        )
        OR public.is_admin()
    );

-- Students can apply for jobs/internships (student_id must be auth.uid())
CREATE POLICY "Students can apply"
    ON public.applications
    FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id = auth.uid()
    );

-- Status updates:
-- Students can update their own application ONLY to 'Withdrawn'.
-- Authorized recruiters can update status for their jobs/internships.
-- Admins can update any application status.
CREATE POLICY "Students withdraw own, recruiters update applicant status"
    ON public.applications
    FOR UPDATE
    TO authenticated
    USING (
        student_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.jobs j
            WHERE j.id = public.applications.job_id AND j.recruiter_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.internships i
            WHERE i.id = public.applications.internship_id AND i.recruiter_id = auth.uid()
        )
        OR public.is_admin()
    )
    WITH CHECK (
        (student_id = auth.uid() AND status = 'Withdrawn')
        OR EXISTS (
            SELECT 1 FROM public.jobs j
            WHERE j.id = public.applications.job_id AND j.recruiter_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.internships i
            WHERE i.id = public.applications.internship_id AND i.recruiter_id = auth.uid()
        )
        OR public.is_admin()
    );
