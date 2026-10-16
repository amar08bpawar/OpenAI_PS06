-- ==============================================================================
-- Placement Hub - Supabase Migration: Functional Resume Builder & Templates
-- Migration: 20261017100000_resume_builder.sql
-- ==============================================================================

-- 1. Resumes Table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'My Placement Resume',
    template_id TEXT NOT NULL DEFAULT 'modern', -- 'modern', 'classic', 'minimal'
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resumes_student_id ON public.resumes(student_id);
CREATE INDEX IF NOT EXISTS idx_resumes_updated_at ON public.resumes(updated_at DESC);

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS set_resumes_updated_at ON public.resumes;
CREATE TRIGGER set_resumes_updated_at
    BEFORE UPDATE ON public.resumes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Row Level Security (RLS) Policies
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Students view only their own resumes (or Admin view for system audits)
CREATE POLICY "Students view own resumes"
    ON public.resumes
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR public.is_admin());

-- Students create their own resumes
CREATE POLICY "Students insert own resumes"
    ON public.resumes
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

-- Students update only their own resumes
CREATE POLICY "Students update own resumes"
    ON public.resumes
    FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

-- Students delete only their own resumes
CREATE POLICY "Students delete own resumes"
    ON public.resumes
    FOR DELETE
    TO authenticated
    USING (student_id = auth.uid());

-- 3. Storage configuration for resumes bucket (private access)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'resumes',
        'resumes',
        false,
        5242880, -- 5 MB limit
        ARRAY['application/pdf']::text[]
    )
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Gracefully proceed if storage schema is mocked or managed externally
END $$;
