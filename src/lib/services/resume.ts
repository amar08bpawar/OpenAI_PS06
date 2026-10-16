import { z } from "zod";
import { executeStructuredCompletion } from "@/lib/services/openai";

export const AIRewriteOutputSchema = z.object({
  suggestion: z.string(),
  keyHighlights: z.array(z.string()).default([]),
});

export type AIRewriteOutput = z.infer<typeof AIRewriteOutputSchema>;

/**
 * Deterministic fallback when OpenAI API key is unconfigured or rate limited.
 * Polishes the text structure without inventing any facts, companies, or metrics.
 */
export function formatResumeTextFallback(
  section: "summary" | "project" | "experience",
  text: string
): AIRewriteOutput {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      suggestion: "",
      keyHighlights: [],
    };
  }

  // Break by sentences or existing newlines
  const sentences = trimmed
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim().replace(/^[-*•]\s*/, ""))
    .filter((s) => s.length > 0);

  if (section === "summary") {
    // Polish into cohesive professional statement
    const polished = sentences
      .map((s) => {
        let sentence = s.charAt(0).toUpperCase() + s.slice(1);
        if (!sentence.endsWith(".")) sentence += ".";
        return sentence;
      })
      .join(" ");

    return {
      suggestion: polished,
      keyHighlights: ["Action-oriented phrasing", "Synthesized summary statement"],
    };
  }

  // For project or experience: format as crisp, action-verb bullet points
  const actionVerbs = [
    "Engineered",
    "Developed",
    "Implemented",
    "Architected",
    "Designed",
    "Optimized",
    "Streamlined",
    "Orchestrated",
  ];

  const bullets = sentences.map((s, index) => {
    let clean = s.charAt(0).toUpperCase() + s.slice(1);
    if (!clean.endsWith(".")) clean += ".";

    // Prepend action verb if first word is weak
    const firstWord = clean.split(" ")[0].toLowerCase();
    const isWeak = ["i", "we", "worked", "helped", "did", "made"].includes(firstWord);

    if (isWeak) {
      const verb = actionVerbs[index % actionVerbs.length];
      const remainder = clean.split(" ").slice(1).join(" ");
      clean = `${verb} ${remainder}`;
    }

    return `• ${clean}`;
  });

  return {
    suggestion: bullets.join("\n"),
    keyHighlights: ["Action-verb bullet formatting", "Factual consistency preserved"],
  };
}

/**
 * Rewrites resume summary, project description, or experience description using OpenAI gpt-4o-mini.
 * Strictly adheres to factual accuracy and never hallucinates unmentioned metrics or qualifications.
 */
export async function rewriteResumeContent(
  section: "summary" | "project" | "experience",
  originalText: string,
  context?: { role?: string; skills?: string[] }
): Promise<{ success: boolean; data?: AIRewriteOutput; error?: string; isFallback?: boolean }> {
  const trimmed = originalText.trim();
  if (!trimmed) {
    return { success: false, error: "Original text cannot be empty." };
  }
  if (trimmed.length > 2000) {
    return { success: false, error: "Content exceeds 2,000 character limit." };
  }

  const roleContext = context?.role ? `Target Role: ${context.role}.` : "";
  const skillsContext = context?.skills && context.skills.length > 0
    ? `Relevant Skills: ${context.skills.join(", ")}.`
    : "";

  const systemPrompt = `You are an elite campus placement resume specialist and technical editor.
Your objective is to polish, refine, and elevate the student's resume draft for ${section.toUpperCase()}.
${roleContext}
${skillsContext}

STRICT SAFETY AND FACTUAL ACCURACY RULES:
1. NEVER invent, fabricate, or assume any educational degrees, institutions, GPA/marks, previous employers, job titles, certifications, award wins, or external links not explicitly present in the user's text.
2. NEVER inject fake metrics (e.g. "increased latency by 99%") if no numerical benchmark was mentioned; instead, describe performance and outcomes cleanly.
3. Use strong, punchy action verbs (e.g., Engineered, Spearheaded, Accelerated, Implemented, Designed).
4. If the section is "project" or "experience", format the output as concise bullet points starting with "• ".
5. If the section is "summary", format the output as a professional 2-3 sentence introductory career profile.
6. Return valid JSON adhering to the required schema: {"suggestion": string, "keyHighlights": string[]}.`;

  const userPrompt = `Student Draft Content for ${section}:
"""
${trimmed}
"""

Please enhance this text while maintaining 100% factual accuracy.`;

  return executeStructuredCompletion<AIRewriteOutput>(
    {
      systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 600,
    },
    AIRewriteOutputSchema as any,
    () => formatResumeTextFallback(section, trimmed)
  );
}
