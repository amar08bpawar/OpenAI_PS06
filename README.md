🚀 Placement Hub
AI-powered placement and recruitment platform that connects students with relevant job opportunities through skill verification, semantic matching, aptitude assessments, and an AI assistant.
Hackathon Project: PS6 — Placement Hub
Goal: Make campus recruitment more skill-focused, transparent, and efficient.

📌 Overview
Placement Hub helps students showcase their skills and helps recruiters discover candidates whose profiles align with job requirements. It combines GitHub-based skill signals, AI-assisted job-description parsing, Retrieval-Augmented Generation (RAG), aptitude quizzes, OTP authentication, and application notifications in one platform.
Key Features
- 🔐 OTP Authentication — Email or phone one-time-password login through Supabase Auth.
- 🧑‍💻 GitHub Skill Signals — Inspect public repository metadata and programming-language usage.
- 🏷️ Skill Status — Distinguish GitHub-observed skills from self-reported or quiz-assessed skills.
- 📝 AI Job Parser — Extract and normalize technical skills from job descriptions.
- 🎯 Semantic Job Matching — Use embeddings and PostgreSQL pgvector to rank candidate/job relevance.
- 🧠 Aptitude & Skill Quizzes — Generate multiple-choice questions to assess specific skills.
- 🤖 AI Copilot — Answer placement-platform questions using relevant, authorized platform context.
- 🔔 Application Notifications — Notify users when application statuses change.
- 📊 Recruiter Dashboard — Review job requirements, candidate matches, and skill evidence.
Important: Public GitHub repository languages are only signals, not proof of a person's proficiency. A quiz result is evidence of performance on that assessment, not a guarantee of job readiness. Label evidence clearly and let users review their profiles.

🧰 Tech Stack
Layer	Technology
Frontend	Next.js / React
Styling	Tailwind CSS, shadcn/ui
Icons and UI feedback	lucide-react, toast notifications
Backend API	Python, FastAPI
Database	Supabase PostgreSQL
Vector search	PostgreSQL pgvector
Authentication	Supabase Auth (Email OTP or Phone OTP)
AI and structured extraction	OpenAI API (gpt-4o-mini)
Embeddings	OpenAI text-embedding-3-small
GitHub data	GitHub REST API
Hackathon UI workflow	Google Antigravity (optional development tool)


Embedding dimensions: text-embedding-3-small produces 1536 dimensions by default. If you change the embedding model or dimensions, keep the database vector column and all embedding-generation code consistent.
🏗️ Architecture
Student / Recruiter
        |
        v
Next.js / React + Tailwind + shadcn/ui
        |
        v
FastAPI Backend
   |       |          |
   |       |          +--> OpenAI API
   |       |                - Job skill extraction
   |       |                - Embeddings
   |       |                - Quiz generation
   |       |                - Placement Copilot
   |       |
   |       +--> GitHub REST API
   |
   +--> Supabase Auth + PostgreSQL + pgvector
                |
                +--> Student profiles and skill evidence
                +--> Jobs and applications
                +--> Semantic matching
                +--> Notification records
Typical User Flow
1. A student signs in using Supabase OTP authentication.
2. The student creates a profile and optionally connects a public GitHub username.
3. The backend retrieves public repository metadata and records observable skill signals.
4. A recruiter submits a job description; the AI parser extracts normalized skills.
5. The platform generates embeddings and ranks relevant candidates.
6. Students can take skill quizzes and view their results.
7. Recruiters update application statuses, triggering notifications.
📂 Suggested Repository Structure
placement-hub/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── services/
│   │   ├── schemas/
│   │   └── db/
│   ├── requirements.txt
│   └── .env.example
├── supabase/
│   └── schema.sql
├── docs/
│   └── screenshots/
├── .gitignore
└── README.md
Adapt this structure to the files actually present in your repository.
⚙️ Getting Started
Prerequisites
Install or prepare:
- Node.js and npm
- Python 3.10+ (use a version compatible with your selected dependencies)
- A Supabase project
- An OpenAI API key
- A GitHub account or username for testing public repository lookups
1. Clone the repository
git clone https://github.com/YOUR_USERNAME/placement-hub.git
cd placement-hub
Replace YOUR_USERNAME with your GitHub username and placement-hub with your repository name.
2. Configure Supabase
1. Create a project in the Supabase Dashboard.
2. Open the SQL Editor.
3. Run the schema in [`supabase/schema.sql`](supabase/schema.sql), after reviewing it.
4. Enable Email OTP and/or Phone OTP in Authentication settings.
5. Configure Row Level Security (RLS) policies before exposing database access to users.
6. Configure the frontend with the Supabase project URL and publishable/anon key.
Use Supabase's supported authentication flow rather than implementing OTP verification yourself. Phone OTP may require an SMS provider and incur charges.
3. Configure the backend
cd backend
python -m venv .venv
Activate the environment:
Windows PowerShell
.venv\Scripts\Activate.ps1
macOS / Linux
source .venv/bin/activate
Install dependencies:
pip install -r requirements.txt
Create backend/.env using the example below, then start the API:
uvicorn app.main:app --reload
The API should be available at http://127.0.0.1:8000. Interactive API documentation is normally available at http://127.0.0.1:8000/docs.
4. Configure the Next.js Frontend Application
From the project root:
```bash
npm install
```

Copy the environment example template to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project URL and anon key in `.env.local`.

Run the automated test suite:
```bash
npm test
```

Build the production application:
```bash
npm run build
```

Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page, register a student, verify email OTP, or sign in.

---

### 🛡️ Phase 1: Authentication & Supabase Setup Details

#### Supabase Database & Migration
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Run the migration script located at [`supabase/migrations/20261016000000_create_auth_and_profiles_schema.sql`](supabase/migrations/20261016000000_create_auth_and_profiles_schema.sql) (or [`supabase/schema.sql`](supabase/schema.sql)).
3. This creates:
   - `public.profiles`: Linked to `auth.users(id)` with roles (`student`, `recruiter`, `administrator`).
   - `public.student_details`: Academic records (degree, course, branch, CGPA, graduation year, skills).
   - `public.recruiter_memberships`: Company affiliations with admin verification status.
   - Triggers:
     - `on_auth_user_created`: Automatically creates a profile and student details on signup, strictly enforcing `role = 'student'`.
     - `check_role_tampering`: Prevents non-administrators from escalating their role.
     - `check_verification_tampering`: Prevents non-administrators from approving recruiter memberships.
   - Row Level Security (RLS) policies guaranteeing students only read/update their own records.

#### Supabase Auth Settings
1. Navigate to **Authentication** -> **Providers** -> **Email**:
   - Enable Email Provider: **ON**
   - Confirm email: **ON** (Sends 6-digit confirmation code / magic link)
2. Navigate to **Authentication** -> **URL Configuration**:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: Add `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/reset-password`
3. Email Templates:
   - Supabase automatically provides the `{{ .Token }}` variable in the "Confirm signup" and "Magic Link" templates for 6-digit OTP verification codes.

#### Testing Authentication Flows
- **Local Validation (No Credentials Required)**:
  Run `npm test` to verify Zod schema validation, environment variable boundaries, RLS SQL migration syntax, and middleware route protection.
- **Live Integration Testing (Requires Supabase Project)**:
  1. **Registration**: Visit `/auth/register`, submit full name, email, password, course, and qualification.
  2. **OTP Verification**: Enter the 6-digit code received in your inbox at `/auth/verify-otp`.
  3. **Session Persistence**: Refresh the browser or navigate across `/dashboard` and `/dashboard/profile`; session cookies remain intact via `@supabase/ssr`.
  4. **Password Reset**: Visit `/auth/forgot-password`, request reset email, and follow link to `/auth/reset-password`.
  5. **Unauthorized Access Protection**: Attempting to visit `/dashboard` while signed out redirects immediately to `/auth/login?redirect=/dashboard`.
  6. **Role Tampering Prevention**: Public signup cannot grant `recruiter` or `administrator` roles; any direct SQL update to `profiles.role` by a non-admin triggers a database security exception.

---

🔑 Environment Variables
Backend — backend/.env
OPENAI_API_KEY=your_openai_api_key
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key

GITHUB_TOKEN=
FRONTEND_ORIGIN=http://localhost:3000
Frontend — frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
Security rules
- Never commit .env, .env.local, API keys, access tokens, or service-role credentials.
- Never expose SUPABASE_SERVICE_ROLE_KEY or OPENAI_API_KEY through a NEXT_PUBLIC_ variable.
- Keep privileged database operations on the backend.
- Validate the user's Supabase access token on protected backend routes.
- Restrict CORS to trusted frontend origins in production.
- Add request limits, timeouts, and input validation to AI and GitHub endpoints.
- Rotate any credential that has accidentally been committed or shared.
🗃️ Database Schema
The following is a starter schema for the core features. Review it and add appropriate RLS policies, indexes, and validation before production use.
Save as supabase/schema.sql:
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.students (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    github_username TEXT,
    verified_skills TEXT[] NOT NULL DEFAULT '{}',
    unverified_skills TEXT[] NOT NULL DEFAULT '{}',
    skills_embedding VECTOR(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    job_embedding VECTOR(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Applied'
        CHECK (status IN ('Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, job_id)
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX jobs_required_skills_idx ON public.jobs USING GIN (required_skills);
CREATE INDEX students_verified_skills_idx ON public.students USING GIN (verified_skills);
CREATE INDEX applications_student_id_idx ON public.applications (student_id);
CREATE INDEX applications_job_id_idx ON public.applications (job_id);
CREATE INDEX notifications_student_unread_idx
    ON public.notifications (student_id, is_read);
RLS and access control
Enable RLS on tables exposed through Supabase's Data API. Create policies so that:
- Students can read and update only their own permitted profile fields.
- Students can read only their own applications and notifications.
- Recruiters can manage only jobs and applications they are authorized to access.
- Sensitive writes and privileged operations are handled by authenticated backend routes or tightly scoped policies.
The schema above does not create those policies automatically. Do not expose the tables to users until appropriate policies are in place. Consider a separate recruiter/company membership table before implementing recruiter access.
Semantic matching function
This example ranks students against a job embedding using cosine distance. It assumes the function is called only from a trusted backend after authorization checks.
CREATE OR REPLACE FUNCTION public.match_students(
    job_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.30,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    similarity FLOAT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        s.id,
        s.name,
        (1 - (s.skills_embedding <=> job_embedding))::FLOAT AS similarity
    FROM public.students AS s
    WHERE s.skills_embedding IS NOT NULL
      AND 1 - (s.skills_embedding <=> job_embedding) >= match_threshold
    ORDER BY s.skills_embedding <=> job_embedding
    LIMIT LEAST(GREATEST(match_count, 1), 100);
$$;
Tune the similarity threshold using representative examples. Similarity scores are ranking signals, not calibrated probabilities of hiring success. Apply authorization and appropriate function permissions before exposing this function.
🔌 Planned API Endpoints
Method	Endpoint	Purpose
GET	/api/health	API health check
GET	/api/verify-github/{username}	Fetch public GitHub repository signals
POST	/api/parse-job	Extract skills from a job description
POST	/api/match-students	Rank candidates against a job
POST	/api/generate-quiz	Generate a skill assessment question
POST	/api/submit-quiz	Evaluate an answer and record the result
POST	/api/copilot	Answer a question using authorized platform context
GET	/api/notifications	List the current user's notifications
PATCH	/api/applications/{id}/status	Update an application status


These are proposed endpoint contracts, not a claim that every route is already implemented. Keep request/response schemas consistent and protect user-specific endpoints with authentication and authorization.
Example job-parser request
{
  "text": "We are looking for a React developer familiar with TypeScript, REST APIs, and PostgreSQL."
}
Example response:
{
  "skills": ["React", "TypeScript", "REST APIs", "PostgreSQL"]
}
Example quiz response
{
  "question": "Which React hook is commonly used to manage local component state?",
  "options": ["useMemo", "useState", "useRef", "useId"],
  "correct_index": 1
}
Implementation note: Do not send correct_index to the browser before the answer is submitted if the quiz is intended to be an assessment. Store the answer key server-side, validate submissions on the backend, and apply rate limits. AI-generated questions and answer keys should be reviewed for correctness.
🧠 AI and RAG Workflow
1. Prepare source text: Normalize job descriptions and student skill profiles.
2. Create embeddings: Use the same embedding model and dimensions for student and job vectors.
3. Store vectors: Save embeddings to students.skills_embedding and jobs.job_embedding.
4. Retrieve matches: Use pgvector cosine distance to find relevant profiles.
5. Apply business rules: Check required qualifications and permissions separately from semantic similarity.
6. Explain results: Present the strongest matching skills and gaps, with evidence labels and a reminder that the score is not a hiring decision.
GitHub skill-signal limitations
- Use the official GitHub REST API and correct public repository endpoints.
- Public unauthenticated API limits apply; a token can increase limits but must remain server-side.
- Repository language metadata does not measure proficiency, contribution quality, or recent activity by itself.
- Handle private repositories only with explicit user authorization and appropriate OAuth scopes.
- Treat usernames and repository metadata as untrusted input; handle API errors, pagination, and rate limits.
🔔 Notifications
When an application status changes:
1. Verify the recruiter is authorized to update that application.
2. Validate the requested status transition.
3. Save the change in the database.
4. Create a notification record for the affected student.
5. Display a toast or notification badge in the frontend.
For a hackathon demo, in-app database notifications may be enough. Email, SMS, or push notifications require additional providers and configuration. Avoid relying on browser alert() for a polished user experience.
🧪 Testing Checklist
- [ ] OTP login succeeds and invalid/expired codes are handled.
- [ ] Students cannot read or change another student's private data.
- [ ] GitHub lookup handles unknown usernames, empty repositories, pagination, and rate limits.
- [ ] Job parser handles empty, very long, and malformed input.
- [ ] Embeddings use consistent dimensions and model configuration.
- [ ] Candidate matching excludes missing embeddings and respects authorization.
- [ ] Quiz answers are graded on the backend.
- [ ] AI assistant cannot access another user's data through supplied context.
- [ ] Application status changes generate the correct notification.
- [ ] Secrets are excluded from Git history and deployment bundles.
- [ ] The application has loading, empty, error, and success states.
⏱️ 24-Hour Hackathon Plan
Time	Focus	Deliverable
Hours 0–3	Supabase, schema, OTP auth	Working login and database
Hours 3–8	GitHub signals, job parser	Profile skill signals and parsed job skills
Hours 8–14	Embeddings, RAG, quiz	Candidate ranking and skill assessment
Hours 14–19	AI Copilot, notifications	Context-aware assistant and status updates
Hours 19–21	Frontend integration	Connected student and recruiter flows
Hours 21–24	Testing and presentation	Stable demo, seed data, screenshots, backup recording


Hackathon priority: Build one complete student flow and one complete recruiter flow first. If time is limited, ship reliable authentication, job parsing, matching, and application status updates before adding optional features.
🚀 Demo Scenarios
Student flow
1. Sign in using OTP.
2. Create a profile and add a public GitHub username.
3. View skill signals and their evidence source.
4. Take a skill quiz.
5. Explore relevant jobs and application status notifications.
Recruiter flow
1. Sign in with a recruiter account.
2. Paste a job description.
3. Review extracted required skills.
4. View ranked candidate matches and supporting evidence.
5. Update an application's status and confirm the notification.
Copilot flow
Ask a question about the signed-in user's authorized placement data. The backend should retrieve the minimum relevant context, avoid exposing other users' private information, and state when the database does not contain an answer.
🔒 Privacy and Responsible Use
- Obtain consent before linking or analyzing a user's GitHub profile.
- Explain what is collected, how skill signals are inferred, and how users can correct them.
- Do not present inferred skills as definitive proof of competence.
- Do not use embedding similarity as the sole basis for hiring or rejection.
- Keep API keys and privileged database credentials on the server.
- Apply authentication, authorization, RLS, rate limits, input validation, and safe logging.
- Avoid sending unnecessary personal information to AI providers.
- Provide a way to correct profile data and request account/data deletion.
🗺️ Roadmap
- [ ] Student and recruiter dashboards
- [ ] Supabase OTP authentication
- [ ] GitHub repository skill signals
- [ ] AI job-description parser
- [ ] Embedding generation and semantic matching
- [ ] Skill quiz generation and server-side grading
- [ ] Context-aware Placement Hub Copilot
- [ ] In-app application notifications
- [ ] RLS policies and automated tests
- [ ] Deployment and demo video
Mark items complete only after they work in the repository.
🤝 Contributing
1. Fork the repository.
2. Create a branch: git checkout -b feature/your-feature.
3. Make and test your changes.
4. Commit: git commit -m "Add your feature".
5. Push the branch and open a pull request.
Please do not commit credentials, personal data, or production database dumps.
📄 License
Choose a license before publishing this project. If you intend to use the MIT License, add a LICENSE file with the appropriate MIT license text and update this section accordingly.