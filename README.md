# Placement Hub

Placement Hub is a student-focused placement preparation platform built with **Next.js, TypeScript, Tailwind CSS, and Supabase**.

**Current phase:** Phase 3 — AI & Skill Development Features Complete (Authentication + Placement Core + OpenAI & GitHub Skills)

## Features

### Phase 1: Authentication & Foundation
- Student registration, email verification (OTP / Confirmation), login, and logout.
- Password recovery and reset flow.
- Session persistence and route middleware protection.
- Role management: `student`, `recruiter`, `administrator`.
- Separation of client, server, and service-role database clients.

### Phase 2: Core Placement Management System
- **Comprehensive Student Profiles:**
  - Academic & personal details: college, qualification, course, graduation year, CGPA, phone, LinkedIn.
  - Technical and soft skills tag management.
  - Dynamic interactive projects and experience lists.
  - Real-time profile completeness indicator.
- **Company Management:**
  - Company directory with search and industry filtering.
  - Company profile details displaying active jobs and internships.
  - Recruiter company registration and association.
- **Job & Internship Management:**
  - Full-time jobs and internships catalogs with multi-parameter search, work-mode filter, and sorting.
  - Detailed listing view with requirements, selection process, and application deadlines.
  - Recruiter workspace for creating, editing, and closing listings.
- **Deterministic Eligibility Engine:**
  - Evaluates CGPA, qualification match, graduation batch, required technical skills, and deadline.
  - Clear Eligible vs. Not Eligible determination with transparent criteria breakdown.
  - Missing student data is strictly treated as unknown / unmet — zero AI guessing.
- **Application Tracking & Candidate Pipeline:**
  - 1-click application submission with duplicate prevention enforced by database unique constraints.
  - Student application tracking with live status and self-withdrawal option.
  - Recruiter candidate management dashboard with student qualifications breakdown and server-validated status transitions (`Applied` → `Shortlisted` → `Interview` → `Selected`, `Rejected`, `Withdrawn`).
  - Strict Row Level Security (RLS) ensuring students see only their own applications and recruiters see only candidates for their listings.

### Phase 3: AI & Skill Development Features
- **Server-Side OpenAI Integration:**
  - Utilizes official OpenAI SDK (`openai`) strictly from server-side code.
  - Safe key isolation: `OPENAI_API_KEY` is loaded from server environment variables only and never exposed to the frontend or browser logs.
  - Structured response parsing and Zod schema validation with timeouts and safe heuristic fallbacks.
- **AI Job Description Parser:**
  - Accepts unstructured job descriptions and extracts normalized technical skills, qualifications, experience requirements, and responsibilities.
  - Returns structured JSON validated via Zod.
  - Mandatory recruiter review step before applying extracted parameters to job forms.
  - Strict non-hallucination guard: absent eligibility criteria are not invented.
- **GitHub Public Skill Evidence:**
  - Inspects public GitHub metadata via the official GitHub REST API (`/users/{username}`, `/repos`, and `/languages`).
  - Aggregates language byte counts, percentage distributions, total stars, and top source repositories.
  - Handles pagination, invalid handles, and API rate limits gracefully without accessing private repositories.
  - Enforces transparent disclaimer labeling: repository data reflects public activity signals and does *not* constitute proof of proficiency.
- **Placement Aptitude Assessments:**
  - Timed practice exams across 6 categories: Logical Reasoning, Quantitative Aptitude, Applied Mathematics, Verbal Ability, Problem Solving, and Core Technical Concepts.
  - Configurable question counts (5, 10, 15) and difficulty tiers (Beginner, Intermediate, Advanced).
  - **Zero Answer Leakage:** Answer keys and explanations are held strictly on the server and stripped from questions sent to the client.
  - **Deterministic Backend Grading:** Scores are computed on the server, passing benchmarks are enforced (>= 60%), and step-by-step explanations are revealed only after submission.
  - Attempt history tracking with student ownership and RLS protection.
- **AI Mock Interview Simulator:**
  - Interactive simulation supporting HR/Behavioral, Technical, Communication, Teamwork, and Full Mock placement rounds.
  - Conversation context safety with strict input limits (max 2,000 characters) and token bounds.
  - Generates realistic follow-up questions accompanied by clear, constructive AI-generated feedback and performance ratings.
- **AI Career Guidance & Skill-Gap Analysis:**
  - Benchmarks student profile against target placement roles (Full Stack, Frontend, Backend, Software Engineer, Data Analyst, Cloud/DevOps, ML).
  - Computes placement readiness diagnostic score (0-100%) and identifies matched vs. gap skills.
  - Flags insufficient profile information explicitly when data is missing.
  - Generates structured learning plans with curated resources and chronological preparation milestones.

### Phase 4: Interactive Resume Builder & Printable Templates
- **Interactive Multi-Section Editor:**
  - Manages contact details, professional summary, education, marks/CGPA, technical & soft skills, projects, internships, work experience, certifications, and honors.
  - Form validation with Zod, dynamic entry creation/deletion, and draft persistence.
  - One-click **"Import Profile"** to pre-populate resume fields from verified academic profile data.
- **Reusable, Professional Resume Templates:**
  - **Modern Clean (`modern`):** Sleek accent styling, bulleted lists, and structured skill organization.
  - **Classic Corporate (`classic`):** Traditional serif typography with horizontal rules preferred by corporate recruitment drives and strict ATS checkers.
  - **Tech Minimalist (`minimal`):** Monospace technical badges and high information density tailored for software engineering candidates.
- **Print & PDF Export via `react-to-print`:**
  - Uses `react-to-print` to isolate the resume canvas for clean printing.
  - Built-in guidance for downloading as PDF: In the browser print dialog, select Destination -> **"Save as PDF"**.
  - Custom Print CSS: A4 dimensions (`@page { size: A4; margin: 12mm 14mm; }`), `-webkit-print-color-adjust: exact`, and `break-inside: avoid` preventing awkward page splits across projects or education entries.
- **Secure AI-Assisted Rewriting:**
  - AI enhancement for career summaries, project deliverables, and work experience descriptions.
  - **Strict Non-Hallucination Policy:** OpenAI prompts and fallback logic never fabricate unmentioned degrees, marks, companies, or metrics.
  - Interactive preview modal allows students to review, edit, or discard suggestions before saving.
- **Supabase Persistence & RLS Security:**
  - `resumes` table stores structured JSON drafts with student ownership policies (`student_id = auth.uid()`).
  - Private storage bucket (`resumes`) with 5MB limits and MIME restrictions.
- **Responsive Workspace:**
  - Split-view desktop editor with sticky live preview updating in real time.
  - Mobile-friendly tab switcher ("Edit Details" vs "Live Preview & Print").

## Technology Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- `react-to-print`
- Supabase Authentication & PostgreSQL Database
- OpenAI SDK (`gpt-4o-mini`)
- GitHub REST API v3
- Zod & React Hook Form
- `@supabase/ssr`

## Prerequisites

Install Node.js and npm. A Supabase project is required to test live authentication and database functionality.

## Getting Started

### 1. Install Dependencies

Open a terminal in the project root:

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env.local` from `.env.example`.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env.local
```

If `.env.local` already exists, do not overwrite it. Edit the existing file instead.

Add the environment values required by your application using your own Supabase project settings. The variable names must match those used in the source code.

**Security requirements:**

- Never commit `.env.local`.
- Never expose Supabase service-role keys or other private server secrets in browser code.
- Keep real credentials out of `.env.example`; use placeholders only.

### 3. Configure Supabase

In your Supabase dashboard:

1. Open Authentication → URL Configuration.
2. Set the local Site URL to `http://localhost:3000`.
3. Add the callback URL `http://localhost:3000/auth/callback`.
4. Add the password-reset URL `http://localhost:3000/auth/reset-password`.
5. Open Authentication → Providers → Email and configure email confirmation or OTP to match the application's implementation.

Make sure the email templates and verification method match the code in the project.

### 4. Set Up the Database

Review the SQL before applying it.

Available schema files:

- `supabase/migrations/20261016000000_create_auth_and_profiles_schema.sql` (Phase 1 Auth & Profiles)
- `supabase/migrations/20261016100000_core_placement_system.sql` (Phase 2 Core Placement System)
- `supabase/schema.sql` (Complete unified schema containing Phase 1 + Phase 2)

Open the Supabase SQL Editor and apply `supabase/schema.sql` (or apply the migrations sequentially).

Available schema files:

- `supabase/migrations/20261016000000_create_auth_and_profiles_schema.sql` (Phase 1 Auth & Profiles)
- `supabase/migrations/20261016100000_core_placement_system.sql` (Phase 2 Core Placement System)
- `supabase/migrations/20261016200000_ai_and_skill_development.sql` (Phase 3 AI & Skill Development)
- `supabase/schema.sql` (Complete unified schema containing Phases 1, 2, and 3)

Open the Supabase SQL Editor and apply `supabase/schema.sql` (or apply the migrations sequentially).

The schema supports:

- **Tables:** `profiles`, `student_details`, `recruiter_memberships`, `companies`, `jobs`, `internships`, `applications`, `aptitude_tests`, `aptitude_questions`, `aptitude_attempts`, `interview_sessions`, `career_guidance_reports`, `student_github_evidence`.
- **Integrity Constraints:**
  - `uq_student_job_application` (`UNIQUE(student_id, job_id)`)
  - `uq_student_internship_application` (`UNIQUE(student_id, internship_id)`)
  - Application status enum constraint (`Applied`, `Shortlisted`, `Interview`, `Selected`, `Rejected`, `Withdrawn`)
  - Aptitude category & difficulty checks
  - Interview category & status checks
- **Row Level Security (RLS) policies:**
  - Profiles & details: Students view & edit only permitted profile fields; tampering with roles is blocked by triggers.
  - Companies: Verified companies visible to authenticated users; recruiters manage their own companies.
  - Jobs & Internships: Public/students view published and approved postings; recruiters manage their own listings.
  - Applications: Students view and withdraw only their own applications; recruiters view and advance applicants for their listings.
  - Aptitude Tests & Questions: Tests and questions readable; question correct answers remain server-side during test delivery.
  - Attempts & Sessions: Students view, insert, and update only their own test attempts, mock interviews, and career guidance reports.
  - GitHub Evidence: Students manage their own evidence; authorized recruiters can inspect applicant evidence.
- **Triggers:** `handle_updated_at` timestamps, `on_auth_user_created` profile sync, `prevent_role_tampering`.

### 5. Start the Development Server

```bash
npm run dev
```

If PowerShell blocks `npm.ps1`, use:

```powershell
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Commands

```bash
npm install        # Install project dependencies
npm run dev        # Launch Next.js development server
npm test           # Run Phase 1, Phase 2, and Phase 3 automated test suites
npm run build      # Perform production build & static optimization
npm run lint       # Run Next.js ESLint checks
```

## Testing Checklists

### Automated Test Suites
Run the offline unit & integration test suites:
```bash
npm test
```
This runs:
1. `tests/auth-validation.test.mjs`: Tests environment security, secret protection, auth Zod schemas, session middleware, and role constraints.
2. `tests/placement-system.test.mjs`: Tests rule-based eligibility evaluation (strict handling of missing data, zero AI guessing), application state machine transitions, duplicate application prevention (PostgreSQL error `23505`), RLS policy definitions, and profile completeness calculation.
3. `tests/phase3-ai-skills.test.mjs`: Tests OpenAI SDK server-only key security, AI Job Description Parser Zod validation (non-hallucination of absent criteria), GitHub REST API rate limits and disclaimer notice, aptitude test question sanitization (answer keys stripped before client delivery), deterministic backend answer grading, interview conversation limits (2000 chars), and career guidance insufficient data handling.

### Phase 1: Authentication Testing Checklist
*(Requires configured Supabase credentials)*
1. **Registration:** Open `/auth/register` and submit student details.
2. **Email verification:** Complete OTP or confirmation at `/auth/verify-otp`.
3. **Login & Session:** Sign in via `/auth/login`; verify session persistence on page refresh.
4. **Password recovery:** Test `/auth/forgot-password` and `/auth/reset-password`.
5. **Route protection:** Verify unauthenticated access to `/dashboard` or `/recruiter` redirects to login.

### Phase 2: Placement System Testing Checklist
*(Requires configured Supabase credentials and applied migrations)*
1. **Student Profile:** Navigate to `/dashboard/profile` and test real-time completeness progress score.
2. **Directory & Listings:** Browse `/companies`, `/jobs`, and `/internships` with search, work-mode filter, and sorting.
3. **Deterministic Eligibility Engine:** Verify that opening job/internship details displays "Eligible" or "Not Eligible" with the exact unmet reasons.
4. **Application Submission:** Apply for a position and confirm duplicate applications are blocked at both UI and database layers.
5. **Application Status Tracking:** Track and withdraw applications at `/dashboard/applications`.
6. **Recruiter Workflow:** Manage listings and advance candidates through pipeline stages at `/recruiter/jobs/[id]/applications`.

### Phase 3: AI & Skill Development Testing Checklist
*(Offline fallback mode works out of the box; live mode uses OPENAI_API_KEY)*
1. **GitHub Public Skill Signals:**
   - Navigate to `/dashboard/github`.
   - Enter a public GitHub username (e.g. `torvalds`) and click "Extract Signals".
   - Confirm public repository count, stars, language distribution bar, and prominent non-proficiency disclaimer.
   - Click "Save Evidence to Profile" to verify persistence into `student_github_evidence`.
2. **Placement Aptitude Assessments:**
   - Navigate to `/dashboard/aptitude`.
   - Select a domain (e.g., Logical, Technical, Quantitative), difficulty (Beginner/Intermediate/Advanced), and question count (5, 10, 15).
   - Launch the assessment: verify the live countdown timer and that answer keys are not inspectable in network payloads.
   - Select answers and click "Submit Test": verify deterministic scoring, pass/fail threshold (60%), step-by-step explanations, and logging in attempt history.
3. **AI Mock Interview Simulator:**
   - Navigate to `/dashboard/interview`.
   - Start an HR or Technical round targeting a specific role (e.g. "Frontend Engineer").
   - Respond to the interviewer's prompt: verify character counter (max 2,000 characters) and review the constructive, labeled `[AI-GENERATED FEEDBACK]` and performance rating.
4. **AI Career Guidance & Gap Analysis:**
   - Navigate to `/dashboard/guidance`.
   - Select a target career pathway (e.g., "Full Stack Developer", "Data Analyst").
   - Click "Analyze Readiness & Generate Roadmap": verify readiness diagnostic score, skills matched vs. skills gap, targeted learning plan, and milestone timeline.
   - If profile lacks recorded skills, verify the system explicitly explains data insufficiency and prompts the student to update their profile.
5. **AI Job Description Parser (Recruiter):**
   - Navigate to `/recruiter/jobs/new`.
   - Click "Auto-Fill via AI Parser" and paste raw job description text.
   - Click "Extract Structured Criteria" and review extracted title, skills, CGPA, qualifications, and responsibilities.
   - Verify that unmentioned criteria remain empty/null without hallucination, and click "Apply Extracted Data to Form" to populate the job opening form.

## Project Structure

```text
placement hub/
├── src/
│   ├── app/
│   │   ├── actions/          # Server actions: listings, applications, aptitude, interview, guidance, github, parser
│   │   ├── auth/             # Login, register, OTP verification, password reset
│   │   ├── companies/        # Company directory and company profile view
│   │   ├── dashboard/        # Student portal: overview, profile, applications, aptitude, interview, guidance, github
│   │   ├── internships/      # Internship catalog and detailed view
│   │   ├── jobs/             # Job catalog and detailed view with eligibility card
│   │   ├── recruiter/        # Recruiter workspace: job management, applicant pipeline, AI parser dialog
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/           # Navbar, mobile navigation, dashboard sidebar, profile menu
│   │   ├── placement/        # Eligibility card, apply button, job parser dialog
│   │   └── ui/               # shadcn/ui components (button, card, dialog, badge, alert, etc.)
│   ├── lib/
│   │   ├── services/         # Deterministic eligibility engine, OpenAI client, job parser, github, aptitude, interview, career guidance
│   │   ├── supabase/         # Supabase client, server, admin, and middleware
│   │   └── validations/      # Zod validation schemas
│   ├── middleware.ts         # Route protection and session refresh middleware
│   └── types/                # TypeScript database and application definitions
├── supabase/
│   ├── migrations/           # Versioned SQL migrations (Phase 1, Phase 2, Phase 3)
│   └── schema.sql            # Master unified schema
├── tests/
│   ├── auth-validation.test.mjs
│   ├── placement-system.test.mjs
│   └── phase3-ai-skills.test.mjs
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Troubleshooting

### Supabase: Failed to fetch

- Check the Supabase project URL.
- Check the public client key and environment-variable names.
- Verify that the Supabase project is reachable.
- Restart the development server after changing environment variables.

### InvalidOrExpiredLink

- Request a fresh verification or password-reset link.
- Check the Supabase redirect URL configuration.
- Confirm that the email template matches the application's verification flow.
- Verify the callback implementation.

### Git Merge Conflict

Remove all conflict markers from the resolved file, save it, then run:

```bash
git add README.md
git status
```

Once the unmerged paths are resolved, complete the merge with a commit and push the changes. Do not use force-push to bypass merge conflicts.

## GitHub Workflow

Check the repository status:

```bash
git status
```

Commit changes:

```bash
git add .
git commit -m "Update Placement Hub documentation"
```

Push the `main` branch:

```bash
git push origin main
```

Before staging files, make sure `.env.local`, private keys, tokens, and other secrets are excluded.

## Next Steps

Before beginning Phase 2, verify that registration, email verification, login, password recovery, session handling, protected routes, and database security policies work correctly.

## License

No license has been specified yet. Add a license file if you plan to distribute or publish this project.
