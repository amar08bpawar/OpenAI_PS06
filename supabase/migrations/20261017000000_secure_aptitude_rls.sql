-- ==============================================================================
-- Placement Hub - Supabase Migration: Secure Aptitude Questions RLS
-- Migration: 20261017000000_secure_aptitude_rls.sql
-- ==============================================================================
-- Removes the open SELECT policy that allowed any authenticated user to view
-- raw question rows (leaking answer keys and explanations).
-- Direct SELECT is restricted to administrators only. Regular students receive
-- sanitized questions (with answers stripped) exclusively via server actions.
-- Server-side grading uses the service-role admin client to retrieve answer keys.

-- 1. Drop the open question viewing policy
DROP POLICY IF EXISTS "Authenticated users can view questions" ON public.aptitude_questions;

-- 2. Ensure only administrators can directly query raw questions with answer keys
CREATE POLICY "Admins can view questions"
    ON public.aptitude_questions
    FOR SELECT
    TO authenticated
    USING (public.is_admin());
