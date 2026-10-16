# Placement Hub

Placement Hub is a student-focused placement preparation platform built with **Next.js, TypeScript, Tailwind CSS, and Supabase**.

**Current phase:** Phase 2 — Core Placement Management System (Authentication + Full Placement Workflow)

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

## Technology Stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Supabase Authentication
- Supabase PostgreSQL
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

The schema supports:

- **Tables:** `profiles`, `student_details`, `recruiter_memberships`, `companies`, `jobs`, `internships`, `applications`
- **Integrity Constraints:**
  - `uq_student_job_application` (`UNIQUE(student_id, job_id)`)
  - `uq_student_internship_application` (`UNIQUE(student_id, internship_id)`)
  - Application status enum constraint (`Applied`, `Shortlisted`, `Interview`, `Selected`, `Rejected`, `Withdrawn`)
- **Row Level Security (RLS) policies:**
  - Profiles: Students view & edit only permitted profile fields; tampering with roles is blocked by triggers.
  - Companies: Verified companies visible to authenticated users; recruiters manage their own companies.
  - Jobs & Internships: Public/students view published and approved postings; recruiters manage their own listings.
  - Applications: Students view and withdraw only their own applications; recruiters view and advance applicants for their listings.
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
npm test           # Run Phase 1 Auth and Phase 2 Placement System automated test suites
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

### Phase 1: Authentication Testing Checklist
*(Requires configured Supabase credentials)*
1. **Registration:** Open `/auth/register` and submit student details.
2. **Email verification:** Complete OTP or confirmation at `/auth/verify-otp`.
3. **Login & Session:** Sign in via `/auth/login`; verify session persistence on page refresh.
4. **Password recovery:** Test `/auth/forgot-password` and `/auth/reset-password`.
5. **Route protection:** Verify unauthenticated access to `/dashboard` or `/recruiter` redirects to login.

### Phase 2: Placement System Testing Checklist
*(Requires configured Supabase credentials and applied migrations)*
1. **Student Profile:**
   - Navigate to `/dashboard/profile`.
   - Update graduation year, CGPA, skills, soft skills, projects, and work experience.
   - Confirm the live profile completion score reflects filled vs. empty fields.
2. **Directory & Listings Exploration:**
   - Browse `/companies`, search by name or filter by industry.
   - Browse `/jobs` and `/internships`; test text search, work-mode filter, and sorting.
3. **Deterministic Eligibility Engine:**
   - Open a job or internship details page (`/jobs/[id]` or `/internships/[id]`).
   - If profile CGPA, degree, or graduation batch does not satisfy listing prerequisites, verify the card displays "Not Eligible" with the exact unmet reason.
   - When criteria are met, verify the badge displays "Eligible".
4. **Application Submission & Duplicate Prevention:**
   - Click "Apply for Position" on an eligible opening.
   - Confirm the application appears in `/dashboard/applications`.
   - Attempting to apply a second time is prevented with a clear duplicate message.
5. **Application Status Tracking & Withdrawal:**
   - On `/dashboard/applications`, review the application status badge.
   - Click "Withdraw Application" to transition status from `Applied` to `Withdrawn`.
6. **Recruiter Workflow:**
   - As a recruiter user, open `/recruiter/company` to register or update company details.
   - Open `/recruiter/jobs/new` to create a job or internship with specific CGPA, batch, and skill criteria.
   - Open `/recruiter/jobs/[id]/applications` to review candidates and advance their stage (`Shortlisted`, `Interview`, `Selected`, `Rejected`).

## Project Structure

```text
placement hub/
├── src/
│   ├── app/
│   │   ├── actions/          # Server actions: listings, applications, auth
│   │   ├── auth/             # Login, register, OTP verification, password reset
│   │   ├── companies/        # Company directory and company profile view
│   │   ├── dashboard/        # Student portal: overview, profile editor, application tracker
│   │   ├── internships/      # Internship catalog and detailed view
│   │   ├── jobs/             # Job catalog and detailed view with eligibility card
│   │   ├── recruiter/        # Recruiter workspace: job management, applicant pipeline
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/           # Navbar, mobile navigation, dashboard sidebar, profile menu
│   │   ├── placement/        # Eligibility card, apply button
│   │   └── ui/               # shadcn/ui components (button, card, dialog, badge, etc.)
│   ├── lib/
│   │   ├── services/         # Deterministic eligibility engine
│   │   ├── supabase/         # Supabase client, server, admin, and middleware
│   │   └── validations/      # Zod validation schemas
│   ├── middleware.ts         # Route protection and session refresh middleware
│   └── types/                # TypeScript database and application definitions
├── supabase/
│   ├── migrations/           # Versioned SQL migrations (Phase 1 & Phase 2)
│   └── schema.sql            # Master unified schema
├── tests/
│   ├── auth-validation.test.mjs
│   └── placement-system.test.mjs
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
