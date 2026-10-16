import { z } from "zod";
import { executeStructuredCompletion } from "./openai";

export const JobParserOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  company_name: z.string().nullable().optional(),
  required_skills: z.array(z.string()),
  optional_skills: z.array(z.string()),
  eligible_qualifications: z.array(z.string()),
  min_cgpa: z.number().nullable().optional(),
  min_experience_years: z.number().nullable().optional(),
  eligible_graduation_years: z.array(z.number()),
  responsibilities: z.array(z.string()),
  work_mode: z.enum(["On-site", "Remote", "Hybrid"]).nullable().optional(),
  location: z.string().nullable().optional(),
  salary_range: z.string().nullable().optional(),
});

export type JobParserOutput = z.infer<typeof JobParserOutputSchema>;

/**
 * Deterministic heuristic extractor used when offline or as a safe fallback.
 * Strictly avoids inventing criteria absent from text.
 */
export function extractJobDetailsHeuristically(rawText: string): JobParserOutput {
  const text = rawText.trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Heuristic title from first line
  const title = lines[0]?.slice(0, 80) || "Job Opening";

  // Common technical skills dictionary for normalization
  const skillDict = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
    "React", "Next.js", "Node.js", "Express", "FastAPI", "Django", "Spring Boot",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Supabase", "AWS", "Azure", "Docker",
    "Kubernetes", "Git", "REST API", "GraphQL", "Tailwind CSS", "HTML", "CSS"
  ];

  const lowerText = text.toLowerCase();
  const detectedSkills = skillDict.filter((skill) => {
    const regex = new RegExp(`\\b${skill.replace(".", "\\.")}\\b`, "i");
    return regex.test(lowerText);
  });

  // Extract qualifications
  const qualDict = ["B.Tech", "B.E.", "M.Tech", "MCA", "BCA", "B.Sc", "M.Sc"];
  const detectedQuals = qualDict.filter((q) => {
    const regex = new RegExp(`\\b${q.replace(".", "\\.")}\\b`, "i");
    return regex.test(lowerText);
  });

  // Extract CGPA if explicitly mentioned (e.g., "7.5 CGPA", "min 7.0 CGPA", "CGPA: 8.0")
  let minCgpa: number | null = null;
  const cgpaMatch = text.match(
    /(?:(?:cgpa|gpa|marks)\s*(?:>=|:|of|above|minimum)?\s*([0-9]+(?:\.[0-9]+)?)|([0-9]+(?:\.[0-9]+)?)\s*(?:\+|and above)?\s*(?:cgpa|gpa|marks))/i
  );
  if (cgpaMatch) {
    const matchedVal = cgpaMatch[1] || cgpaMatch[2];
    if (matchedVal) {
      const val = parseFloat(matchedVal);
      if (val >= 4.0 && val <= 10.0) {
        minCgpa = val;
      }
    }
  }

  // Work mode
  let workMode: "On-site" | "Remote" | "Hybrid" | null = null;
  if (lowerText.includes("remote")) workMode = "Remote";
  else if (lowerText.includes("hybrid")) workMode = "Hybrid";
  else if (lowerText.includes("on-site") || lowerText.includes("onsite")) workMode = "On-site";

  // Graduation batches e.g. "2024, 2025 batch", "2025 passouts"
  const gradYears: number[] = [];
  const yearMatches = text.match(/\b(202[3-9]|2030)\b/g);
  if (yearMatches) {
    for (const m of yearMatches) {
      const yr = parseInt(m, 10);
      if (!gradYears.includes(yr)) gradYears.push(yr);
    }
  }

  // Responsibilities
  const bulletLines = lines.filter((l) => l.startsWith("-") || l.startsWith("•") || l.startsWith("*"));
  const responsibilities = bulletLines.slice(0, 6).map((l) => l.replace(/^[-•*]\s*/, ""));

  return {
    title,
    summary: lines.slice(1, 3).join(" ") || "Position extracted from provided job description.",
    company_name: null,
    required_skills: detectedSkills.slice(0, 8),
    optional_skills: [],
    eligible_qualifications: detectedQuals,
    min_cgpa: minCgpa,
    min_experience_years: lowerText.includes("fresher") ? 0 : null,
    eligible_graduation_years: gradYears.slice(0, 3),
    responsibilities: responsibilities.length > 0 ? responsibilities : ["Execute core engineering responsibilities."],
    work_mode: workMode,
    location: null,
    salary_range: null,
  };
}

/**
 * Parses raw job description using OpenAI gpt-4o-mini with fallback to heuristic extractor.
 * Strictly adheres to not inventing criteria absent from text.
 */
export async function parseJobDescription(rawText: string): Promise<{
  success: boolean;
  data?: JobParserOutput;
  error?: string;
  isFallback?: boolean;
}> {
  if (!rawText || rawText.trim().length < 20) {
    return {
      success: false,
      error: "Job description is too brief. Please provide at least a few sentences describing the position.",
    };
  }

  const systemPrompt = `You are a recruitment data extraction specialist.
Analyze the provided job description and extract structured requirements in JSON format.

CRITICAL INSTRUCTIONS:
- Do NOT invent or hallucinate eligibility criteria absent from the original text!
- If minimum CGPA or marks are NOT explicitly stated, set "min_cgpa" to null.
- If qualifications/degrees are NOT specified, set "eligible_qualifications" to an empty array [].
- If graduation years or batches are NOT mentioned, set "eligible_graduation_years" to [].
- Normalize technical skills into standard names (e.g., "React.js" -> "React", "Postgres" -> "PostgreSQL").
- Separate required core skills from optional/bonus skills.
- Extract responsibilities as concise bullet points.
- Output MUST be a valid JSON object matching the requested schema.`;

  const userPrompt = `Job Description Text:\n"""\n${rawText.slice(0, 4000)}\n"""`;

  return executeStructuredCompletion<JobParserOutput>(
    {
      systemPrompt,
      userPrompt,
      temperature: 0.1, // low temperature for deterministic factual extraction
    },
    JobParserOutputSchema,
    () => extractJobDetailsHeuristically(rawText)
  );
}
