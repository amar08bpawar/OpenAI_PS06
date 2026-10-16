-- ==============================================================================
-- Migration: 20261016200000_ai_and_skill_development.sql
-- Description: Phase 3 Schema for Aptitude Tests, Interview Sessions,
--              Career Guidance Reports, and GitHub Public Skill Evidence.
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

-- ==============================================================================
-- Triggers
-- ==============================================================================
DROP TRIGGER IF EXISTS set_interview_sessions_updated_at ON public.interview_sessions;
CREATE TRIGGER set_interview_sessions_updated_at
    BEFORE UPDATE ON public.interview_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE public.aptitude_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aptitude_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aptitude_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_guidance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_github_evidence ENABLE ROW LEVEL SECURITY;

-- APTITUDE TESTS POLICIES
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

-- APTITUDE QUESTIONS POLICIES
-- Raw questions containing answer keys (correct_option) are only directly viewable
-- by administrators. Students receive sanitized questions exclusively via server actions.
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

-- APTITUDE ATTEMPTS POLICIES
-- Students view and create only their own test attempts
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

-- INTERVIEW SESSIONS POLICIES
-- Students manage only their own interview sessions
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

-- CAREER GUIDANCE POLICIES
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

-- GITHUB EVIDENCE POLICIES
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
