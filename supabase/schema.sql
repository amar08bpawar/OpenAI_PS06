-- ==============================================================================
-- Placement Hub - Complete Master Schema (Phase 1: Auth, Profiles, Roles)
-- ==============================================================================

-- 1. Helper function for automated updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'recruiter', 'administrator')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. Student Details Table
CREATE TABLE IF NOT EXISTS public.student_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    course TEXT NOT NULL,
    qualification TEXT NOT NULL,
    branch TEXT,
    graduation_year INT CHECK (graduation_year >= 1990 AND graduation_year <= 2100),
    cgpa NUMERIC(4, 2) CHECK (cgpa >= 0.0 AND cgpa <= 10.0),
    github_username TEXT,
    skills TEXT[] NOT NULL DEFAULT '{}',
    resume_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_student_details_user_id ON public.student_details(user_id);
CREATE INDEX IF NOT EXISTS idx_student_details_skills ON public.student_details USING GIN (skills);

-- 4. Recruiter Memberships Table
CREATE TABLE IF NOT EXISTS public.recruiter_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    designation TEXT,
    company_website TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_recruiter_user_company UNIQUE (user_id, company_name)
);

CREATE INDEX IF NOT EXISTS idx_recruiter_memberships_user_id ON public.recruiter_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_memberships_verified ON public.recruiter_memberships(is_verified);

-- 5. Timestamp triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_student_details_updated_at ON public.student_details;
CREATE TRIGGER set_student_details_updated_at
    BEFORE UPDATE ON public.student_details
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_recruiter_memberships_updated_at ON public.recruiter_memberships;
CREATE TRIGGER set_recruiter_memberships_updated_at
    BEFORE UPDATE ON public.recruiter_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Role escalation guard trigger
CREATE OR REPLACE FUNCTION public.prevent_role_tampering()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
        IF auth.role() IS NOT NULL AND auth.role() != 'service_role' THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'administrator'
            ) THEN
                RAISE EXCEPTION 'Access Denied: You cannot modify privileged role fields.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_role_tampering ON public.profiles;
CREATE TRIGGER check_role_tampering
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_role_tampering();

-- 7. Recruiter verification guard trigger
CREATE OR REPLACE FUNCTION public.prevent_verification_tampering()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.is_verified IS DISTINCT FROM NEW.is_verified) THEN
        IF auth.role() IS NOT NULL AND auth.role() != 'service_role' THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'administrator'
            ) THEN
                RAISE EXCEPTION 'Access Denied: Recruiter company verification can only be approved by an administrator.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_verification_tampering ON public.recruiter_memberships;
CREATE TRIGGER check_verification_tampering
    BEFORE UPDATE OF is_verified ON public.recruiter_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_verification_tampering();

-- 8. Trigger on auth.users creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_course TEXT;
    v_qualification TEXT;
BEGIN
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        v_full_name,
        'student'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;

    v_course := NEW.raw_user_meta_data->>'course';
    v_qualification := NEW.raw_user_meta_data->>'qualification';

    IF v_course IS NOT NULL OR v_qualification IS NOT NULL THEN
        INSERT INTO public.student_details (
            user_id,
            course,
            qualification
        )
        VALUES (
            NEW.id,
            COALESCE(v_course, 'Unspecified'),
            COALESCE(v_qualification, 'Undergraduate')
        )
        ON CONFLICT (user_id) DO UPDATE
        SET course = EXCLUDED.course,
            qualification = EXCLUDED.qualification;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 9. Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_memberships ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'administrator'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_recruiter_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('recruiter', 'administrator')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR public.is_recruiter_or_admin()
    );

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Students can view own details, recruiters/admins can view all"
    ON public.student_details
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR public.is_recruiter_or_admin()
    );

CREATE POLICY "Students can insert own details"
    ON public.student_details
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own details"
    ON public.student_details
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can delete own details"
    ON public.student_details
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Recruiters view own, admins view all memberships"
    ON public.recruiter_memberships
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR public.is_admin()
    );

-- ==============================================================================
-- PHASE 3: AI & SKILL DEVELOPMENT SCHEMA
-- Migration: 20261016200000_ai_and_skill_development.sql
-- ==============================================================================

-- 1. Aptitude Tests Table
CREATE TABLE IF NOT EXISTS public.aptitude_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('logical', 'quantitative', 'mathematics', 'verbal', 'problem_solving', 'technical')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    description TEXT,
    time_limit_minutes INT NOT NULL DEFAULT 15,
    total_questions INT NOT NULL DEFAULT 5,
    is_generated BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_aptitude_tests_category ON public.aptitude_tests(category);
CREATE INDEX IF NOT EXISTS idx_aptitude_tests_difficulty ON public.aptitude_tests(difficulty);

-- 2. Aptitude Questions Table
CREATE TABLE IF NOT EXISTS public.aptitude_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.aptitude_tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option INT NOT NULL CHECK (correct_option >= 0 AND correct_option <= 3),
    explanation TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_aptitude_questions_test_id ON public.aptitude_questions(test_id);

-- 3. Aptitude Attempts Table
CREATE TABLE IF NOT EXISTS public.aptitude_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES public.aptitude_tests(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    total_questions INT NOT NULL,
    correct_count INT NOT NULL DEFAULT 0,
    time_spent_seconds INT NOT NULL DEFAULT 0,
    user_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    passed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_aptitude_attempts_student_id ON public.aptitude_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_aptitude_attempts_test_id ON public.aptitude_attempts(test_id);

-- 4. Interview Sessions Table
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('hr', 'technical', 'communication', 'teamwork', 'mock')),
    role_target TEXT NOT NULL DEFAULT 'Software Engineer',
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    overall_feedback TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_student_id ON public.interview_sessions(student_id);

-- 5. Career Guidance Reports Table
CREATE TABLE IF NOT EXISTS public.career_guidance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_role TEXT NOT NULL,
    analysis JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_career_guidance_student_id ON public.career_guidance_reports(student_id);

-- 6. Student GitHub Evidence Table
CREATE TABLE IF NOT EXISTS public.student_github_evidence (
    student_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    public_repos_count INT NOT NULL DEFAULT 0,
    total_stars INT NOT NULL DEFAULT 0,
    languages JSONB NOT NULL DEFAULT '{}'::jsonb,
    top_repos JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_fetched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Triggers
DROP TRIGGER IF EXISTS set_interview_sessions_updated_at ON public.interview_sessions;
CREATE TRIGGER set_interview_sessions_updated_at
    BEFORE UPDATE ON public.interview_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.aptitude_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aptitude_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aptitude_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_guidance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_github_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view aptitude tests"
    ON public.aptitude_tests
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins and recruiters can manage tests"
    ON public.aptitude_tests
    FOR ALL
    TO authenticated
    USING (public.is_recruiter_or_admin())
    WITH CHECK (public.is_recruiter_or_admin());

CREATE POLICY "Admins can view questions"
    ON public.aptitude_questions
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can manage questions"
    ON public.aptitude_questions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Students view own test attempts"
    ON public.aptitude_attempts
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students insert own test attempts"
    ON public.aptitude_attempts
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students view own interview sessions"
    ON public.interview_sessions
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students create own interview sessions"
    ON public.interview_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students update own interview sessions"
    ON public.interview_sessions
    FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin())
    WITH CHECK (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students view own career guidance"
    ON public.career_guidance_reports
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students create own career guidance"
    ON public.career_guidance_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Users view github evidence"
    ON public.student_github_evidence
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_recruiter_or_admin());

CREATE POLICY "Students manage own github evidence"
    ON public.student_github_evidence
    FOR ALL
    TO authenticated
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());


CREATE POLICY "Recruiters can insert own membership"
    ON public.recruiter_memberships
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND is_verified = FALSE
    );

CREATE POLICY "Recruiters can update own details"
    ON public.recruiter_memberships
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any recruiter membership"
    ON public.recruiter_memberships
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
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

-- ==============================================================================
-- Placement Hub - Supabase Migration: Functional Resume Builder & Templates
-- Migration: 20261017100000_resume_builder.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'My Placement Resume',
    template_id TEXT NOT NULL DEFAULT 'modern',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_resumes_student_id ON public.resumes(student_id);
CREATE INDEX IF NOT EXISTS idx_resumes_updated_at ON public.resumes(updated_at DESC);

DROP TRIGGER IF EXISTS set_resumes_updated_at ON public.resumes;
CREATE TRIGGER set_resumes_updated_at
    BEFORE UPDATE ON public.resumes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own resumes"
    ON public.resumes
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students insert own resumes"
    ON public.resumes
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students update own resumes"
    ON public.resumes
    FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students delete own resumes"
    ON public.resumes
    FOR DELETE
    TO authenticated
    USING (student_id = auth.uid());

