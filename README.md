
# Placement Hub

Placement Hub is a campus placement and skill-development platform built with **Next.js App Router, TypeScript, Tailwind CSS, Supabase, and OpenAI**. It helps students manage academic profiles, evaluate placement eligibility, prepare for recruitment, create resumes, and track applications.

> [!CAUTION]
> **Security and production readiness**
>
> Do not deploy this application for real students or recruiters until the database schema, Row Level Security (RLS) policies, role-protection mechanisms, authentication flows, and automated tests have been reviewed and verified in the target environment.
>
> Never commit service-role keys, API keys, passwords, access tokens, or other secrets to source control.

## Table of Contents

1. [Core Features](#core-features)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Prerequisites and System Requirements](#prerequisites-and-system-requirements)
5. [Local Development Setup](#local-development-setup)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Database Migrations and RLS Policies](#database-migrations-and-rls-policies)
8. [Staging and Demo Seed Data](#staging-and-demo-seed-data)
9. [External Services, Costs, and Rate Limits](#external-services-costs-and-rate-limits)
10. [Production Deployment Guide](#production-deployment-guide)
11. [Testing and Quality Assurance](#testing-and-quality-assurance)
12. [Manual Smoke-Test Checklist](#manual-smoke-test-checklist)
13. [Known Limitations and Future Scope](#known-limitations-and-future-scope)

---

## Core Features

### 1. Authentication and Role-Based Access Control

- Student registration, login, logout, and email verification.
- Email OTP verification and supported confirmation-link flows.
- Password recovery and reset flows, where configured.
- Session management using Supabase authentication and `@supabase/ssr`.
- Role-aware access for students, recruiters, and administrators.
- Server-side authorization checks for protected operations.
- Pending recruiter registration and verification workflows.

**Security requirement:** Registration must not allow users to choose privileged roles. Recruiter and administrator access must be granted only through an authorized provisioning and verification process.

### 2. Student Academic Profiles

- Academic information, including institution, qualification, course, graduation year, and CGPA or percentage.
- Contact information and optional professional profile links.
- Technical and soft-skill management.
- Structured projects, internships, and experience records.
- Profile completeness feedback to help students identify missing information.

### 3. Company, Job, and Internship Management

- Company directory with search and industry filtering.
- Company information, including location, website, and contact details.
- Job and internship listings with eligibility criteria and application deadlines.
- Work-mode filters for on-site, hybrid, and remote opportunities, where supported by the listing data.
- Recruiter tools for managing listings.
- Company verification and listing approval workflows.

Company verification and listing approval are separate controls. A company must not be treated as verified merely because a recruiter has registered an account.

### 4. Placement Eligibility Evaluation

- Deterministic evaluation of configured eligibility criteria, such as CGPA, qualification, graduation year, required skills, and deadlines.
- Clear eligible or not-eligible results.
- Explanations of unmet criteria.
- Missing student information is treated as unknown or unmet rather than guessed.

Eligibility results should reflect the actual criteria stored in the database. They must not be presented as a guarantee of selection by an employer.

### 5. Application Tracking and Candidate Pipeline

- Application submission for eligible opportunities.
- Duplicate-application prevention through application logic and database constraints, where configured.
- Student application status tracking.
- Recruiter-side review of applicants for authorized listings.
- Candidate-stage management, where supported by the application workflow.
- Ownership checks and RLS policies intended to prevent unauthorized access to applications.

All application status changes must be validated on the server.

### 6. AI-Assisted Skill Development

The project includes AI-assisted preparation features using the OpenAI API, subject to environment configuration and the available implementation.

- **Job-description parsing:** Extracts structured requirements from job descriptions for review before use.
- **Aptitude practice:** Supports configured categories of logical reasoning, quantitative aptitude, verbal ability, problem solving, mathematics, and technical concepts.
- **Server-side grading:** Assessment answers must be evaluated on the server.
- **Mock interviews:** Provides practice questions and constructive feedback where implemented.
- **Career readiness:** Helps identify potential skill gaps and preparation priorities.
- **Learning roadmaps:** Organizes suggested preparation activities into milestones.

AI-generated suggestions should be reviewed before they are used for applications or career decisions. They must not invent qualifications, work experience, project results, or achievements.

### 7. Resume Builder

- Structured resume sections for contact information, education, skills, projects, experience, and relevant achievements.
- Profile import where supported.
- Multiple resume templates where implemented.
- Resume preview and print functionality.
- Browser-based PDF export through the print dialog, where configured.
- AI-assisted writing improvements that preserve the accuracy of the student's original information.
- Supabase persistence and storage controls, where configured.

Students should review all generated resume content before exporting or submitting it. The application must not fabricate credentials or measurable results.

### 8. GitHub Public Skill Evidence

Where configured, the platform can analyze publicly available GitHub information, including:

- Public repositories.
- Repository stars and activity signals.
- Programming-language distribution.
- Basic public repository metadata.

Public GitHub activity is an indicator of visible work, not proof of professional proficiency. The application must not access private repositories without an explicitly authorized integration.

---

## System Architecture

The application uses a Next.js frontend and server-side functionality connected to Supabase services.

```text
Student / Recruiter
        |
        v
Next.js App Router
        |
        +--> Authentication and Session Management
        |
        +--> Server Components and Server Actions
        |
        +--> Input Validation and Authorization
        |
        +--> Supabase Client
        |       |
        |       +--> PostgreSQL Database
        |       +--> Row Level Security Policies
        |       +--> Supabase Storage
        |
        +--> OpenAI API (server-side, when configured)
        |
        +--> GitHub REST API (public data, where configured)
```

### Architecture and security principles

- Keep privileged credentials on the server.
- Validate user input before performing database mutations.
- Verify authorization on the server for every protected operation.
- Use RLS policies as a database-level security boundary.
- Do not rely on hidden buttons or client-side route checks as the only access control.
- Do not expose assessment answer keys to clients before submission.
- Handle API errors, timeouts, and rate limits without exposing secrets.
- Treat external API responses and AI-generated content as untrusted input.

The diagram describes the intended architecture. Verify that each integration and security control is implemented in the current codebase.

---

## Technology Stack

| Component | Technology |
|---|---|
| Application framework | Next.js App Router |
| Programming language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Database access | Supabase client libraries |
| Server-side sessions | `@supabase/ssr` |
| AI integration | OpenAI API |
| Input validation | Zod, where used |
| Repository evidence | GitHub REST API, where configured |
| Resume printing | `react-to-print`, where configured |
| Automated testing | Project-configured test tooling |

Check `package.json` for the exact installed versions and available scripts.

---

## Prerequisites and System Requirements

Install the following before starting development:

- Node.js version compatible with the project's `package.json` and Next.js version.
- npm, or the package manager used by the repository.
- Git.
- A Supabase project for authentication and database services.
- An OpenAI API key if AI-powered features are required.
- A GitHub token only if the configured GitHub integration requires one.

Recommended tools:

- Visual Studio Code.
- Supabase Dashboard and SQL Editor.
- A modern browser.
- Git command-line tools.

---

## Local Development Setup

### 1. Open the project

```powershell
cd "C:\Users\ACER\Desktop\placement hub"
```

If your repository is in a different location, use that directory instead.

### 2. Install dependencies

```powershell
npm install
```

### 3. Configure environment variables

Create a local `.env.local` file in the project root. Add the variables required by your application and use the reference below.

Do not copy real credentials into this README or commit `.env.local`.

### 4. Configure Supabase

1. Open your Supabase project.
2. Confirm the project URL and public client key.
3. Review `supabase/schema.sql`.
4. Apply the database schema and policies to a development or staging database only after reviewing the SQL.
5. Configure authentication providers, email delivery, and allowed redirect URLs.
6. Confirm that RLS is enabled and the policies match the intended authorization model.

Do not assume that creating a Supabase project automatically applies the schema in this repository.

### 5. Start the development server

```powershell
npm run dev
```

Open the local URL displayed in the terminal, normally:

```text
http://localhost:3000
```

### 6. Run the checks

Use the scripts actually defined in `package.json`. Common commands for this project include:

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build
```

If a command is not defined in `package.json`, check the available scripts before running it.

---

## Environment Variables Reference

The application may require the following variables, depending on which features are enabled.

| Variable | Purpose | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public client key, if used by the project | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key, if used instead of the anon key | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server-side Supabase access, if required | Secret |
| `OPENAI_API_KEY` | OpenAI API access | Secret |
| `GITHUB_TOKEN` | Optional GitHub API authentication, if implemented | Secret |

**Important:**

- Use the variable names expected by the current source code.
- Do not configure both alternative public Supabase keys unless the application expects both.
- Never prefix a private service-role key or API secret with `NEXT_PUBLIC_`.
- Never expose a service-role key in browser code, client components, logs, or public repositories.
- Use a secret manager or deployment-provider environment settings for production secrets.
- Do not commit `.env.local`.

If a required variable is missing, the application should fail safely with a clear configuration error rather than exposing secret values.

---

## Database Migrations and RLS Policies

The repository includes a Supabase schema file:

```text
supabase/schema.sql
```

This file contains database definitions and security-related configuration for the features represented in the repository. Review the current file before applying it to a database.

### Before applying database changes

1. Back up any database that contains data you need to preserve.
2. Review all table, index, constraint, trigger, function, and policy changes.
3. Confirm that the SQL is compatible with the current Supabase schema.
4. Apply changes to development or staging first.
5. Run security tests using separate student, recruiter, and administrator accounts.
6. Verify both permitted and denied operations.
7. Document the migration and rollback procedure before production deployment.

### Row Level Security checklist

Verify that:

- Students can access only their own private profile information and applications.
- Recruiters can access only information needed for their authorized listings and candidate-review workflows.
- Recruiter membership verification cannot be self-approved.
- Company verification and listing approval are restricted to authorized administrators.
- Role changes cannot be performed by ordinary authenticated users.
- Server-side privileged operations validate the requesting user and the intended action.
- Storage policies prevent unauthorized access to private resumes and other files.

RLS policy names and the presence of a policy do not prove that the policy is correct. Test the effective permissions against the deployed schema.

### Role protection

New accounts should receive the default least-privileged role established by the database.

Recruiter registration should create a pending access request without granting recruiter privileges automatically. Administrator provisioning must be performed through a documented, authorized procedure that is compatible with the deployed database's protection triggers.

Do not use ad hoc SQL statements in setup documentation to promote arbitrary accounts to recruiter or administrator roles.

---

## Staging and Demo Seed Data

The project includes:

```text
supabase/seed.sql
```

The seed script is intended to provide demo organizations and aptitude-assessment data for development or staging.

### Safe seeding procedure

1. Confirm that you are connected to the correct development or staging database.
2. Read `supabase/seed.sql` before executing it.
3. Confirm that the target tables and columns match `supabase/schema.sql`.
4. Check whether the script uses fixed IDs and how it handles existing records.
5. Run the script in the intended environment.
6. Verify the inserted records and the assessment questions.
7. Confirm that no real user credentials or privileged role assignments are included.

The script should not create fake authentication accounts, store passwords, or grant privileged roles.

**Important:** Demo data is not production data. Verify company status, listing approval status, and assessment correctness before exposing seed records to users.

---

## External Services, Costs, and Rate Limits

### Supabase

Supabase provides database, authentication, and storage services.

- Usage and pricing depend on the selected plan and consumption.
- Authentication email delivery may require provider configuration.
- Database capacity, storage, and request limits depend on the plan.
- Keep RLS and storage access policies enabled and tested.

### OpenAI

OpenAI-powered features require a valid server-side API key and an available model.

- API costs depend on model selection and token usage.
- Apply reasonable request-size and output-size limits.
- Handle timeouts, quota errors, and rate limits.
- Avoid logging sensitive personal information or API secrets.
- Do not treat AI-generated eligibility or career suggestions as guaranteed outcomes.

### GitHub API

The optional GitHub integration uses public repository data.

- API rate limits depend on whether the request is authenticated.
- Handle missing users, inaccessible repositories, rate limits, and network failures.
- Do not imply that public activity proves skill proficiency.

Check the providers' official documentation for current pricing, quotas, and usage limits before deployment.

---

## Production Deployment Guide

Do not deploy until the security and regression checks are complete.

### Pre-deployment checklist

- [ ] Review the current database schema and all RLS policies.
- [ ] Test role-protection triggers and privileged operations.
- [ ] Verify student, recruiter, and administrator authorization boundaries.
- [ ] Confirm recruiter verification and company approval workflows.
- [ ] Confirm that secrets are stored only in server-side environment settings.
- [ ] Configure the production Supabase URL and required public key.
- [ ] Configure email delivery and authentication redirect URLs.
- [ ] Configure OpenAI and GitHub credentials only if those integrations are enabled.
- [ ] Run the automated test suite.
- [ ] Run linting and TypeScript checks.
- [ ] Build the application successfully.
- [ ] Test authentication, password recovery, and sign-out.
- [ ] Test unauthorized access to protected routes and server actions.
- [ ] Verify storage permissions for private resumes.
- [ ] Remove unnecessary demo data and test accounts.
- [ ] Confirm logging, monitoring, backups, and recovery procedures.
- [ ] Review privacy, data-retention, and institutional requirements.

### Deployment steps

1. Configure the production environment variables in the hosting provider.
2. Apply reviewed database migrations through the approved deployment process.
3. Deploy the application.
4. Run smoke tests against the deployed environment.
5. Verify authentication, database access, RLS, and external integrations.
6. Monitor application errors and usage after deployment.

A successful build alone does not establish production readiness.

---

## Testing and Quality Assurance

Run the test scripts defined in `package.json`.

Typical commands include:

```powershell
npm test
npm run lint
npx tsc --noEmit
npm run build
```

### Recommended test coverage

**Authentication**

- Valid and invalid login attempts.
- Registration validation.
- Email verification and recovery flows.
- Session persistence and sign-out.
- Safe handling of expired or missing sessions.

**Authorization**

- Student access to student-only features.
- Recruiter access only after proper authorization.
- Administrator-only actions.
- Attempts to change roles or verification flags without permission.
- Direct requests to protected server actions and routes.

**Placement workflows**

- Eligibility calculations for valid and invalid profiles.
- Missing student data.
- Expired application deadlines.
- Duplicate applications.
- Unauthorized candidate access.
- Invalid application status transitions.

**AI and assessments**

- Invalid and oversized inputs.
- API failures and rate limits.
- Server-side assessment grading.
- No answer-key leakage before submission.
- AI suggestions that preserve the truth of supplied information.

**Resumes and storage**

- Correct ownership of saved resumes.
- Unauthorized file access.
- Print layout and PDF export.
- Validation of imported profile data.

Record the actual test results before describing the application as passing. Do not claim that a test suite or deployment check passed unless it was run successfully.

---

## Manual Smoke-Test Checklist

Use separate test accounts and a non-production database.

### Authentication

- [ ] Register a student account.
- [ ] Complete the configured email verification flow.
- [ ] Sign in and sign out.
- [ ] Verify password recovery.
- [ ] Verify that protected pages require a valid session.

### Student features

- [ ] Create and update a student profile.
- [ ] Add and edit skills, projects, and experience.
- [ ] Check profile completeness.
- [ ] View job and internship listings.
- [ ] Verify eligibility explanations.
- [ ] Submit an eligible application.
- [ ] Confirm that duplicate applications are rejected.
- [ ] Check application status tracking.
- [ ] Create, save, preview, and print a resume.
- [ ] Test aptitude and AI preparation features that are configured.

### Recruiter features

- [ ] Submit a recruiter access request.
- [ ] Verify that registration does not automatically grant recruiter privileges.
- [ ] Confirm that pending users cannot perform privileged recruiter operations.
- [ ] Verify company registration and approval status.
- [ ] Verify listing submission and approval rules.
- [ ] Confirm that recruiters cannot access unauthorized applicants or listings.

### Security

- [ ] Attempt unauthorized role changes.
- [ ] Attempt unauthorized company verification.
- [ ] Attempt to access another student's private data.
- [ ] Attempt unauthorized access to private resume files.
- [ ] Confirm that API keys and service-role credentials are not exposed to the browser.
- [ ] Review server logs for leaked secrets or sensitive data.

---

## Known Limitations and Future Scope

The following areas should be evaluated against the current implementation before they are considered complete.

- **Administrative provisioning:** A documented, tested process is required for initial administrator access and subsequent role management.
- **Recruiter approval:** Registration, identity review, membership verification, and role activation must work together securely.
- **Company and listing approval:** Each status transition must be authorized and enforced by server-side checks and database policies.
- **Skill evidence:** Public repository activity is only a signal and cannot establish proficiency by itself.
- **AI-generated content:** Suggestions can be inaccurate and must remain reviewable by the student.
- **External services:** API availability, quotas, costs, and provider configuration can affect features.
- **Production hardening:** Monitoring, backups, rate limiting, privacy review, and incident response need explicit validation.
- **Automated coverage:** All security-sensitive operations should have regression tests, including denied operations.

Potential future improvements include verified skill evidence, stronger job-to-student matching explanations, placement analytics, improved recruiter review tools, alumni referral workflows, and a structured interview-question bank.

---

## Project Structure

The following is a representative structure. Confirm exact filenames and routes in the current repository.

```text
placement hub/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── recruiter/
│   │   └── ...
│   ├── components/
│   └── lib/
├── supabase/
│   ├── schema.sql
│   └── seed.sql
├── tests/
├── public/
├── .env.local              # Local only; never commit
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.*
└── README.md
```

## Contributing

1. Create a feature branch.
2. Keep changes focused and reviewable.
3. Validate inputs and enforce authorization on the server.
4. Add regression tests for security-sensitive changes.
5. Run the available lint, type-check, test, and build commands.
6. Review the diff before committing.
7. Never commit secrets, real user data, or unapproved production database changes.

## Security Reporting

Do not publish API keys, passwords, access tokens, personal data, or exploitable details in public issues. Report security concerns through the project's designated private reporting channel.

## License

Add the project's applicable license here if one has been selected. Do not assume that the project is open source or assign a license without authorization.
