-- ==============================================================================
-- Migration: 20261017140000_student_saved_courses.sql
-- Description: Phase 9 Additive Schema for Student Saved Courses & Progress Tracking
--              associated with Coursera Skill Development Hub.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.student_saved_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'coursera',
    title TEXT NOT NULL,
    partner_name TEXT,
    course_url TEXT NOT NULL,
    image_url TEXT,
    category TEXT,
    difficulty TEXT,
    skills TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'Saved' CHECK (status IN ('Saved', 'In Progress', 'Completed')),
    saved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_saved_course UNIQUE (student_id, provider, course_id)
);

CREATE INDEX IF NOT EXISTS idx_student_saved_courses_student_id ON public.student_saved_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_student_saved_courses_status ON public.student_saved_courses(status);

-- Automated updated_at trigger
DROP TRIGGER IF EXISTS set_student_saved_courses_updated_at ON public.student_saved_courses;
CREATE TRIGGER set_student_saved_courses_updated_at
    BEFORE UPDATE ON public.student_saved_courses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.student_saved_courses ENABLE ROW LEVEL SECURITY;

-- 1. Students can view their own saved courses; admins can view all
DROP POLICY IF EXISTS "Students view own saved courses" ON public.student_saved_courses;
CREATE POLICY "Students view own saved courses"
    ON public.student_saved_courses
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin());

-- 2. Students can insert courses for themselves only
DROP POLICY IF EXISTS "Students insert own saved courses" ON public.student_saved_courses;
CREATE POLICY "Students insert own saved courses"
    ON public.student_saved_courses
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

-- 3. Students can update their own saved courses (e.g., status changes)
DROP POLICY IF EXISTS "Students update own saved courses" ON public.student_saved_courses;
CREATE POLICY "Students update own saved courses"
    ON public.student_saved_courses
    FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin())
    WITH CHECK (student_id = auth.uid() OR public.is_admin());

-- 4. Students can delete their own saved courses
DROP POLICY IF EXISTS "Students delete own saved courses" ON public.student_saved_courses;
CREATE POLICY "Students delete own saved courses"
    ON public.student_saved_courses
    FOR DELETE
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin());
