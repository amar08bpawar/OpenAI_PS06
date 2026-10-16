import { z } from "zod";
import type { CareerGuidanceAnalysis, StudentDetails, Profile } from "@/types/database";
import { executeStructuredCompletion } from "./openai";

export const CareerGuidanceSchema = z.object({
  skills_matched: z.array(z.string()),
  skills_gap: z.array(z.string()),
  readiness_score: z.number().min(0).max(100),
  recommended_learning_plan: z.array(
    z.object({
      skill: z.string(),
      action: z.string(),
      resources: z.array(z.string()),
    })
  ),
  milestones: z.array(z.string()),
  advice: z.string(),
  is_data_sufficient: z.boolean(),
  insufficient_reason: z.string().nullable().optional(),
});

const ROLE_BENCHMARK_SKILLS: Record<string, string[]> = {
  "Full Stack Developer": ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL", "REST API", "Git", "Docker"],
  "Frontend Developer": ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "Redux"],
  "Backend Developer": ["Python", "Java", "Node.js", "PostgreSQL", "Redis", "Docker", "REST API", "System Design"],
  "Data Analyst": ["Python", "SQL", "Excel", "PowerBI", "Tableau", "Pandas", "Statistics", "Data Visualization"],
  "Machine Learning Engineer": ["Python", "PyTorch", "TensorFlow", "Pandas", "Scikit-Learn", "Linear Algebra", "Docker", "MLOps"],
  "Cloud / DevOps Engineer": ["Linux", "AWS", "Docker", "Kubernetes", "CI/CD", "Terraform", "Git", "Networking"],
  "Software Engineer": ["Data Structures", "Algorithms", "Java", "C++", "SQL", "Git", "Object-Oriented Design"],
};

export function analyzeCareerReadinessHeuristically(
  studentProfile: Profile | null,
  studentDetails: Partial<StudentDetails> | null,
  targetRole: string
): CareerGuidanceAnalysis {
  const skills = (studentDetails?.skills || []).map((s) => s.trim());
  const projects = studentDetails?.projects || [];
  const qualification = studentDetails?.qualification || "";

  // Check data sufficiency
  if (skills.length === 0 && projects.length === 0 && !qualification) {
    return {
      skills_matched: [],
      skills_gap: ROLE_BENCHMARK_SKILLS[targetRole] || ROLE_BENCHMARK_SKILLS["Software Engineer"],
      readiness_score: 10,
      recommended_learning_plan: [
        {
          skill: "Profile Completion",
          action: "Update your profile with your academic degree, technical skills, and at least one project.",
          resources: ["Placement Hub Profile Editor"],
        },
      ],
      milestones: [
        "Step 1: Document all academic and extracurricular technical projects.",
        "Step 2: Add self-assessed and GitHub-verified technical skills.",
      ],
      advice: "Your profile currently contains minimal information. Career recommendations are heavily limited until you record your skills and academic background.",
      is_data_sufficient: false,
      insufficient_reason: "Profile lacks recorded skills, projects, and educational qualification.",
    };
  }

  const benchmark = ROLE_BENCHMARK_SKILLS[targetRole] || ROLE_BENCHMARK_SKILLS["Software Engineer"];
  const lowerStudentSkills = skills.map((s) => s.toLowerCase());

  const matched: string[] = [];
  const gap: string[] = [];

  for (const b of benchmark) {
    if (lowerStudentSkills.some((s) => s.includes(b.toLowerCase()) || b.toLowerCase().includes(s))) {
      matched.push(b);
    } else {
      gap.push(b);
    }
  }

  const matchRatio = benchmark.length > 0 ? matched.length / benchmark.length : 0.5;
  const projectBonus = Math.min(projects.length * 10, 20);
  const rawScore = Math.round(matchRatio * 70 + projectBonus + (qualification ? 10 : 0));
  const readiness_score = Math.min(Math.max(rawScore, 15), 95);

  const learningPlan = gap.slice(0, 4).map((skill) => ({
    skill,
    action: `Build a focused portfolio project demonstrating proficiency in ${skill}.`,
    resources: [
      `Official ${skill} Documentation`,
      `FreeCodeCamp / Coursera ${skill} Specialization`,
      `GitHub Awesome-${skill.toLowerCase()} repositories`,
    ],
  }));

  const milestones = [
    `Month 1: Bridge core skill gaps in ${gap.slice(0, 2).join(" & ") || "system fundamentals"}.`,
    `Month 2: Develop and deploy a full-featured capstone application addressing ${targetRole} requirements.`,
    `Month 3: Dedicate 3 weeks to timed aptitude tests and mock technical interviews on Placement Hub.`,
  ];

  const advice = `You have built a solid foundation with ${matched.join(", ") || "initial academic coursework"}. To maximize your selection rate for ${targetRole} campus drives, prioritize closing the gap in ${gap.slice(0, 3).join(", ") || "advanced production patterns"}.`;

  return {
    skills_matched: matched,
    skills_gap: gap,
    readiness_score,
    recommended_learning_plan: learningPlan,
    milestones,
    advice,
    is_data_sufficient: true,
    insufficient_reason: null,
  };
}

export async function generateCareerGuidance(params: {
  studentProfile: Profile | null;
  studentDetails: Partial<StudentDetails> | null;
  targetRole: string;
}): Promise<{
  success: boolean;
  data?: CareerGuidanceAnalysis;
  error?: string;
  isFallback?: boolean;
}> {
  const { studentProfile, studentDetails, targetRole } = params;

  const fallbackGenerator = () =>
    analyzeCareerReadinessHeuristically(studentProfile, studentDetails, targetRole);

  const studentSkills = studentDetails?.skills || [];
  const studentProjects = (studentDetails?.projects || []).map((p: any) => p.title).join(", ");
  const qualification = studentDetails?.qualification || "Unspecified";
  const cgpa = studentDetails?.cgpa || "Unspecified";

  const systemPrompt = `You are a university career placement counselor.
Analyze candidate profile data and provide personalized placement guidance for the role: "${targetRole}".

RULES:
- Base recommendations strictly on provided student data.
- If the student has zero skills and zero projects listed, set "is_data_sufficient" to false and explain what is missing.
- Identify "skills_matched" and "skills_gap" by comparing against industry expectations for "${targetRole}".
- Return a realistic "readiness_score" between 0 and 100.
- Provide a structured "recommended_learning_plan" with skills, concrete actions, and verified learning resources.
- Output MUST strictly adhere to the requested JSON schema.`;

  const userPrompt = `Student Profile:
- Target Role: ${targetRole}
- Degree: ${qualification} (Course: ${studentDetails?.course || "N/A"})
- CGPA: ${cgpa}
- Skills: ${studentSkills.length > 0 ? studentSkills.join(", ") : "None recorded"}
- Projects: ${studentProjects || "None recorded"}`;

  return executeStructuredCompletion(
    { systemPrompt, userPrompt, temperature: 0.2, maxTokens: 1200 },
    CareerGuidanceSchema,
    fallbackGenerator
  );
}
