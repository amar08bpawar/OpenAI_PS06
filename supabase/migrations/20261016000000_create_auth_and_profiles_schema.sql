-- ==============================================================================
-- Placement Hub - Supabase Migration: Auth, Profiles, and Roles
-- Migration: 20261016000000_create_auth_and_profiles_schema.sql
-- Description: Creates profiles, student_details, and recruiter_memberships
-- tables with strict Row Level Security (RLS), role-tampering guards, and
-- automated user creation trigger.
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

-- Index on role for fast role lookups
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
-- Prevents regular users from changing their own role column or promoting themselves
CREATE OR REPLACE FUNCTION public.prevent_role_tampering()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if role is being modified
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
        -- Only postgres internal or service_role should be allowed to change roles directly
        IF auth.role() IS NOT NULL AND auth.role() != 'service_role' THEN
            -- Also check if current user is an admin
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
-- Prevents non-administrators from marking their company verification status as TRUE
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
-- Automatically creates public.profiles and initial public.student_details upon auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_course TEXT;
    v_qualification TEXT;
BEGIN
    -- Extract full_name with fallbacks
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Enforce that public signup always creates the default 'student' role
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

    -- If student course/qualification were supplied during registration, persist in student_details
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

-- ==============================================================================
-- 9. Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_memberships ENABLE ROW LEVEL SECURITY;

-- Security helper functions
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

-- PROFILES POLICIES
-- Anyone authenticated can view their own profile; recruiters/admins can view student profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR public.is_recruiter_or_admin()
    );

-- Users can update their own profile (trigger ensures role cannot be escalated)
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can update any profile (e.g. promoting roles)
CREATE POLICY "Admins can update any profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- STUDENT DETAILS POLICIES
-- Students can view their own details; recruiters and admins can view candidate details
CREATE POLICY "Students can view own details, recruiters/admins can view all"
    ON public.student_details
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR public.is_recruiter_or_admin()
    );

-- Students can insert their own student details
CREATE POLICY "Students can insert own details"
    ON public.student_details
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Students can update their own student details
CREATE POLICY "Students can update own details"
    ON public.student_details
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Students can delete their own student details
CREATE POLICY "Students can delete own details"
    ON public.student_details
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- RECRUITER MEMBERSHIPS POLICIES
-- Recruiters can view their own company memberships; Admins can view all
CREATE POLICY "Recruiters view own, admins view all memberships"
    ON public.recruiter_memberships
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR public.is_admin()
    );

-- Recruiters can submit membership requests (is_verified must be false)
CREATE POLICY "Recruiters can insert own membership"
    ON public.recruiter_memberships
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND is_verified = FALSE
    );

-- Recruiters can update their own company info (trigger prevents tampering with is_verified)
CREATE POLICY "Recruiters can update own details"
    ON public.recruiter_memberships
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can update any membership (including verification status)
CREATE POLICY "Admins can update any recruiter membership"
    ON public.recruiter_memberships
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
