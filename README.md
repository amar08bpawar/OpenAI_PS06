# Placement Hub

Placement Hub is a student-focused placement preparation platform built with **Next.js, TypeScript, Tailwind CSS, and Supabase**.

**Current phase:** Phase 1 — Authentication and Supabase Setup

## Features

- Student registration and login
- Email OTP and confirmation flow
- Forgot-password and password-reset pages
- Authentication callback handling
- Protected dashboard and profile pages
- Supabase client, server, and middleware integration
- Database schema and migration files
- Authentication validation tests

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

- `supabase/migrations/20261016000000_create_auth_and_profiles_schema.sql`
- `supabase/schema.sql`

Open the Supabase SQL Editor and apply the appropriate schema. Check the existing database first; do not run both files blindly if they create the same database objects.

The schema files are intended to support:

- `public.profiles`
- `public.student_details`
- `public.recruiter_memberships`
- Row Level Security (RLS) policies
- Supporting database triggers

Review and test the security policies before using real user data.

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
npm install
npm run dev
npm test
npm run build
```

Check `package.json` for the scripts available in your project.

## Authentication Testing Checklist

Use a test account and your own Supabase project.

1. **Registration:** Open `/auth/register` and submit the required details.
2. **Email verification:** Complete the OTP or confirmation process at `/auth/verify-otp`, as implemented.
3. **Login:** Sign in through `/auth/login`.
4. **Protected routes:** Test `/dashboard` and `/dashboard/profile` while signed in and signed out.
5. **Password recovery:** Test `/auth/forgot-password` and `/auth/reset-password`.
6. **Session persistence:** Refresh the browser and verify that the session behaves correctly.
7. **Security:** Verify that users cannot access or modify other users' private records.

Successful compilation does not guarantee that live authentication works. Test each flow against your configured Supabase project.

## Project Structure

```text
placement hub/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   └── dashboard/
│   ├── components/
│   ├── lib/
│   ├── middleware.ts
│   └── types/
├── supabase/
│   ├── migrations/
│   └── schema.sql
├── tests/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
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
