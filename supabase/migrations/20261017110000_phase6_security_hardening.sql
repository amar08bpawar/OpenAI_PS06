
-- Phase 6: Database-level listing approval and company verification security.
-- Existing rows are not modified by this migration.

-- New listings should require administrator approval by default.
ALTER TABLE public.jobs
    ALTER COLUMN approval_status SET DEFAULT 'pending';

ALTER TABLE public.internships
    ALTER COLUMN approval_status SET DEFAULT 'pending';

-- New companies must not be verified by default.
ALTER TABLE public.companies
    ALTER COLUMN is_verified SET DEFAULT FALSE;


-- Restrict direct approval-status changes to administrators.
-- The service role is trusted server-side code and bypasses user-level checks.
CREATE OR REPLACE FUNCTION public.guard_listing_approval_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF COALESCE(auth.role(), '') = 'service_role'
       OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.approval_status IS DISTINCT FROM 'pending' THEN
            RAISE EXCEPTION
                'Only administrators can create pre-approved listings.';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
            RAISE EXCEPTION
                'Only administrators can change listing approval status.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_jobs_approval_status
    ON public.jobs;

CREATE TRIGGER guard_jobs_approval_status
BEFORE INSERT OR UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.guard_listing_approval_status();

DROP TRIGGER IF EXISTS guard_internships_approval_status
    ON public.internships;

CREATE TRIGGER guard_internships_approval_status
BEFORE INSERT OR UPDATE ON public.internships
FOR EACH ROW
EXECUTE FUNCTION public.guard_listing_approval_status();


-- Restrict company verification to administrators.
CREATE OR REPLACE FUNCTION public.guard_company_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF COALESCE(auth.role(), '') = 'service_role'
       OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.is_verified IS DISTINCT FROM FALSE THEN
            RAISE EXCEPTION
                'Only administrators can create verified companies.';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
            RAISE EXCEPTION
                'Only administrators can change company verification.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_company_verification
    ON public.companies;

CREATE TRIGGER guard_company_verification
BEFORE INSERT OR UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.guard_company_verification();


-- Keep the existing recruiter/admin role and ownership checks.
-- Also require non-administrators to submit pending listings.
DROP POLICY IF EXISTS "Recruiters and admins can insert jobs"
    ON public.jobs;

CREATE POLICY "Recruiters and admins can insert jobs"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_recruiter_or_admin()
    AND recruiter_id = auth.uid()
    AND (
        public.is_admin()
        OR approval_status = 'pending'
    )
);

DROP POLICY IF EXISTS "Recruiters and admins can insert internships"
    ON public.internships;

CREATE POLICY "Recruiters and admins can insert internships"
ON public.internships
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_recruiter_or_admin()
    AND recruiter_id = auth.uid()
    AND (
        public.is_admin()
        OR approval_status = 'pending'
    )
);

-- Recruiters may register companies, but only as unverified companies.
DROP POLICY IF EXISTS "Recruiters and admins can create companies"
    ON public.companies;

CREATE POLICY "Recruiters and admins can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_recruiter_or_admin()
    AND (created_by IS NULL OR created_by = auth.uid())
    AND (
        public.is_admin()
        OR is_verified = FALSE
    )
);
