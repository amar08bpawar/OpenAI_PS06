
-- ==============================================================================
-- Placement Hub - Demo & Staging Seed Data
-- File: supabase/seed.sql
-- Description: Provides realistic demo data for testing and development.
-- CAUTION: Run this script only in development or staging environments.
-- ==============================================================================

-- 1. Sample Hiring Organizations
-- Demo companies remain unverified until the authorized review process.
INSERT INTO public.companies (
    id, name, logo_url, description, location, industry, website,
    contact_email, contact_phone, is_verified
)
VALUES
    (
        'c1111111-1111-1111-1111-111111111111',
        'Acme Cloud Dynamics',
        'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=128&h=128&fit=crop',
        'Leading provider of enterprise cloud infrastructure and resilient microservices.',
        'Bengaluru, India',
        'Cloud & Infrastructure',
        'https://acmecloud.example.com',
        'campus@acmecloud.example.com',
        '+91 80 1234 5678',
        FALSE
    ),
    (
        'c2222222-2222-2222-2222-222222222222',
        'NexaByte Technologies',
        'https://images.unsplash.com/photo-1551434678-e076c223a692?w=128&h=128&fit=crop',
        'Next-generation fintech solutions delivering real-time payments and fraud detection.',
        'Hyderabad, India',
        'Fintech & Security',
        'https://nexabyte.example.com',
        'talent@nexabyte.example.com',
        '+91 40 9876 5432',
        FALSE
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'PulseHealth AI',
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=128&h=128&fit=crop',
        'Healthcare intelligence platform transforming clinical insights using machine learning.',
        'Pune, India',
        'HealthTech & AI',
        'https://pulsehealth.example.com',
        'careers@pulsehealth.example.com',
        '+91 20 5555 1234',
        FALSE
    )
ON CONFLICT (id) DO NOTHING;


-- 2. Sample Aptitude Tests
INSERT INTO public.aptitude_tests (
    id, title, category, difficulty, description,
    time_limit_minutes, total_questions, is_generated
)
VALUES
    (
        't1111111-1111-1111-1111-111111111111',
        'Core Logical Reasoning Diagnostic',
        'logical',
        'intermediate',
        'Evaluate deductive reasoning, pattern sequences, and analytical logic.',
        15, 5, FALSE
    ),
    (
        't2222222-2222-2222-2222-222222222222',
        'Quantitative Aptitude Benchmark',
        'quantitative',
        'intermediate',
        'Test arithmetic problem solving, percentages, ratios, and work-time calculations.',
        15, 5, FALSE
    ),
    (
        't3333333-3333-3333-3333-333333333333',
        'Full Stack Engineering Foundations',
        'technical',
        'advanced',
        'Core concepts in data structures, SQL indexing, HTTP protocols, and async execution.',
        20, 5, FALSE
    )
ON CONFLICT (id) DO NOTHING;


-- 3. Sample Questions for Core Logical Reasoning Diagnostic
INSERT INTO public.aptitude_questions (
    id, test_id, question_text, options, correct_option, explanation, order_index
)
VALUES
    (
        'q1111111-1111-1111-1111-111111111111',
        't1111111-1111-1111-1111-111111111111',
        'Find the next number in the sequence: 3, 7, 15, 31, 63, ?',
        '["124", "127", "128", "131"]'::jsonb,
        1,
        'Each term is calculated as the previous term multiplied by 2, then increased by 1. Therefore, 63 * 2 + 1 = 127.',
        1
    ),
    (
        'q2222222-2222-2222-2222-222222222222',
        't1111111-1111-1111-1111-111111111111',
        'All roses are flowers. Some flowers fade quickly. Which conclusion must follow strictly?',
        '["All roses fade quickly", "No roses fade quickly", "Some flowers that fade quickly may be roses", "None of the above are guaranteed"]'::jsonb,
        3,
        'The premises do not guarantee that any roses fade quickly. The flowers that fade quickly could be entirely outside the set of roses.',
        2
    ),
    (
        'q3333333-3333-3333-3333-333333333333',
        't1111111-1111-1111-1111-111111111111',
        'Pointing to a photograph, a woman says: "He is the son of the only daughter of the father of my brother." Who is the person?',
        '["Her nephew", "Her brother", "Her son", "Her father"]'::jsonb,
        2,
        'The father of her brother is her father. Assuming she is the only daughter of her father, the person is her son.',
        3
    ),
    (
        'q4444444-4444-4444-4444-444444444444',
        't1111111-1111-1111-1111-111111111111',
        'If in a certain code, "CLOUD" is written as "ENQWF", how is "SCALE" written?',
        '["UECNG", "UECMG", "TECNG", "UDBNG"]'::jsonb,
        0,
        'Each letter is shifted forward by 2 positions: S to U, C to E, A to C, L to N, and E to G. The answer is UECNG.',
        4
    ),
    (
        'q5555555-5555-5555-5555-555555555555',
        't1111111-1111-1111-1111-111111111111',
        'Statements: Some developers are musicians. All musicians are creative. Conclusions: I. Some developers are creative. II. All creative people are developers.',
        '["Only I follows", "Only II follows", "Both I and II follow", "Neither follows"]'::jsonb,
        0,
        'Some developers are musicians, and all musicians are creative. Therefore, some developers are creative. Conclusion II does not necessarily follow.',
        5
    )
ON CONFLICT (id) DO NOTHING;


-- 4. Sample Technical Foundations Questions
INSERT INTO public.aptitude_questions (
    id, test_id, question_text, options, correct_option, explanation, order_index
)
VALUES
    (
        'q6666666-6666-6666-6666-666666666666',
        't3333333-3333-3333-3333-333333333333',
        'What is the average time complexity of searching in a Hash Map with uniform hashing?',
        '["O(1)", "O(log n)", "O(n)", "O(n log n)"]'::jsonb,
        0,
        'Hash maps provide expected O(1) lookup under the assumption of a suitable, approximately uniform hash distribution.',
        1
    ),
    (
        'q7777777-7777-7777-7777-777777777777',
        't3333333-3333-3333-3333-333333333333',
        'In PostgreSQL, which index type is best suited for equality and range queries on ordered scalar data?',
        '["GIN", "B-Tree", "BRIN", "Hash"]'::jsonb,
        1,
        'B-Tree indexes efficiently support equality and range comparisons for many scalar data types.',
        2
    ),
    (
        'q8888888-8888-8888-8888-888888888888',
        't3333333-3333-3333-3333-333333333333',
        'In Next.js App Router, how should database mutations be handled securely?',
        '["Through window.fetch in useEffect", "Through server-side actions or endpoints with validated inputs and authorization", "By importing database credentials into client state", "Using WebSocket broadcast"]'::jsonb,
        1,
        'Database mutations should be handled on the server with input validation and authorization checks. Private credentials must not be exposed to client code.',
        3
    ),
    (
        'q9999999-9999-9999-9999-999999999999',
        't3333333-3333-3333-3333-333333333333',
        'What HTTP status code is most appropriate when a valid request cannot be processed due to a business rule, such as a duplicate application?',
        '["400 Bad Request", "409 Conflict", "403 Forbidden", "422 Unprocessable Entity"]'::jsonb,
        1,
        '409 Conflict is appropriate when a request conflicts with the current state of a resource, such as an application that already exists.',
        4
    ),
    (
        'qa000000-0000-0000-0000-000000000000',
        't3333333-3333-3333-3333-333333333333',
        'Which cookie attribute helps restrict when browsers send session cookies with cross-site requests?',
        '["SameSite=Lax or SameSite=Strict", "Access-Control-Allow-Origin: *", "X-Frame-Options: ALLOW-FROM", "Cache-Control: public"]'::jsonb,
        0,
        'The SameSite cookie attribute helps control cross-site cookie sending and can mitigate some CSRF attacks. Cookie security also depends on the application design and other protections.',
        5
    )
ON CONFLICT (id) DO NOTHING;


-- ==============================================================================
-- RECRUITER ACCESS AND ADMINISTRATOR PROVISIONING
--
-- Recruiter registration should create a pending membership with is_verified
-- set to FALSE. Registration alone must not grant recruiter access.
--
-- Membership records use the current schema fields, including user_id,
-- company_id, company_name, designation, and is_verified.
--
-- An authorized administrator must verify the recruiter's identity,
-- organization, and membership before granting recruiter access. Verification
-- and any required role provisioning must use a reviewed workflow compatible
-- with the database's role-protection triggers and RLS policies.
--
-- Do not directly update public.profiles.role through this seed script.
-- Do not mark companies or recruiter memberships as verified without completing
-- the required verification process.
--
-- Initial administrator access must be established by an authorized database
-- owner or deployment operator using a secure provisioning procedure consistent
-- with the schema's role-protection controls.
--
-- This seed file does not provision recruiters or administrators.
-- ==============================================================================
