import { z } from "zod";
import type { InterviewCategory, InterviewMessage } from "@/types/database";
import { executeStructuredCompletion } from "./openai";

export const InterviewResponseSchema = z.object({
  reply: z.string(),
  feedback: z.string(),
  rating: z.enum(["Needs Improvement", "Satisfactory", "Strong", "Exceptional"]).optional(),
});

export type InterviewResponse = z.infer<typeof InterviewResponseSchema>;

export const INTERVIEWER_DISCLAIMER =
  "AI NOTICE: Feedback and ratings are simulated by an AI model for practice purposes and should be used as guidance rather than an official hiring evaluation.";

const CATEGORY_PROMPTS: Record<InterviewCategory, string> = {
  hr: "Focus on behavioral questions, culture fit, career aspirations, strengths, weaknesses, and scenario-based questions using the STAR framework.",
  technical: "Focus on core software engineering principles, algorithms, data structures, system design, databases, and problem-solving methodologies.",
  communication: "Focus on articulation, clarity of explanation, active listening, structured answers, and professional verbal etiquette.",
  teamwork: "Focus on handling disagreements, cross-functional collaboration, empathy, accountability, and project delivery in team environments.",
  mock: "Conduct a full realistic placement round mixing introductory, technical, and behavioral questions tailored to campus recruiting.",
};

const FALLBACK_FLOWS: Record<InterviewCategory, { initial: string; questions: string[] }> = {
  hr: {
    initial: "Welcome to your HR Mock Interview. Could you please introduce yourself and tell me what motivates you to pursue a role in this industry?",
    questions: [
      "Can you describe a situation where you had to meet a tight deadline under significant pressure?",
      "Tell me about a time you made a mistake on a project. How did you handle it and what did you learn?",
      "Where do you see yourself professionally in the next three to five years?",
      "Why are you particularly interested in our organization over other campus recruiters?",
    ],
  },
  technical: {
    initial: "Welcome to your Technical Interview. Could you walk me through the architecture of a project you built, highlighting the technical stack and key trade-offs?",
    questions: [
      "How do you decide between using a relational database (SQL) versus a document store (NoSQL)?",
      "Explain how you would optimize an API endpoint experiencing high latency and database contention.",
      "What is the difference between concurrency and parallelism, and how have you handled asynchronous tasks in your projects?",
      "Walk me through your debugging methodology when faced with an elusive memory leak or production bug.",
    ],
  },
  communication: {
    initial: "Welcome! To begin, how would you explain the concept of an API to a non-technical stakeholder or client?",
    questions: [
      "How do you tailor your communication style when presenting technical challenges to executive management?",
      "Describe a time you had to deliver difficult feedback to a peer. How did you structure your communication?",
      "How do you ensure requirements are mutually understood when kicking off a new sprint or project?",
    ],
  },
  teamwork: {
    initial: "Welcome to your Teamwork & Collaboration session. Describe a time you had a fundamental disagreement with a teammate on a project. How did you resolve it?",
    questions: [
      "How do you handle a team member who is not pulling their weight or missing commitments?",
      "Tell me about a successful group project where everyone had different skill sets. How was work distributed?",
      "How do you foster an inclusive and productive atmosphere in an engineering team?",
    ],
  },
  mock: {
    initial: "Hello and welcome to your Comprehensive Mock Placement Interview. Let's begin with a quick introduction: what is your strongest technical skill and how have you demonstrated it in a project?",
    questions: [
      "That's great. Now, how does that project scale if the user base grows by 100x overnight?",
      "Tell me about a time when a project requirement changed at the last minute. How did you adapt?",
      "Do you have any questions for me as an interviewer about the company or the engineering culture?",
    ],
  },
};

export function getInitialInterviewMessage(
  category: InterviewCategory,
  roleTarget: string = "Software Engineer"
): InterviewMessage {
  const flow = FALLBACK_FLOWS[category] || FALLBACK_FLOWS.hr;
  return {
    role: "assistant",
    content: `${flow.initial} (Targeting: ${roleTarget})`,
    timestamp: new Date().toISOString(),
    feedback: null,
  };
}

/**
 * Generates the next interviewer reply and constructive feedback on the student's answer.
 */
export async function continueInterview(params: {
  category: InterviewCategory;
  roleTarget: string;
  messages: InterviewMessage[];
  userMessage: string;
}): Promise<{
  success: boolean;
  data?: InterviewResponse;
  error?: string;
  isFallback?: boolean;
}> {
  const { category, roleTarget, messages, userMessage } = params;

  // Sanitize user message
  const trimmed = userMessage.trim();
  if (!trimmed) {
    return { success: false, error: "Please enter an answer to proceed." };
  }
  if (trimmed.length > 2000) {
    return { success: false, error: "Message is too long. Please keep your response within 2000 characters." };
  }

  // Fallback simulator generator
  const getFallback = (): InterviewResponse => {
    const flow = FALLBACK_FLOWS[category] || FALLBACK_FLOWS.hr;
    const userMessageCount = messages.filter((m) => m.role === "user").length;
    const nextQ = flow.questions[userMessageCount % flow.questions.length];

    let rating: "Needs Improvement" | "Satisfactory" | "Strong" = "Satisfactory";
    if (trimmed.length > 200) rating = "Strong";
    else if (trimmed.length < 50) rating = "Needs Improvement";

    return {
      reply: nextQ,
      feedback: `Good attempt! ${
        trimmed.length > 150
          ? "You provided concrete details. To elevate your answer, ensure you quantify outcomes (e.g., % improvement, users impacted)."
          : "Your response is a bit brief. In campus placement interviews, aim to use the STAR method (Situation, Task, Action, Result) to provide sufficient depth."
      }`,
      rating,
    };
  };

  const systemPrompt = `You are a seasoned campus placement interviewer conducting a mock interview for the role of "${roleTarget}".
Domain focus: ${CATEGORY_PROMPTS[category]}

INSTRUCTIONS:
1. Provide constructive, encouraging, and actionable feedback on the candidate's latest response.
2. Formulate the next logical follow-up interview question.
3. Keep the tone professional, supportive, and realistic.
4. Output MUST be valid JSON with keys:
   - "reply": Next question / comment from the interviewer.
   - "feedback": Constructive analysis of the candidate's response (clarity, depth, structure, STAR method adherence).
   - "rating": One of "Needs Improvement", "Satisfactory", "Strong", "Exceptional".`;

  // Safely window recent history
  const recentHistory = messages.slice(-6).map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
  const userPrompt = `Conversation History:\n${recentHistory}\n\nCANDIDATE LATEST ANSWER:\n"${trimmed}"\n\nGenerate the next question and critique.`;

  return executeStructuredCompletion(
    { systemPrompt, userPrompt, temperature: 0.4, maxTokens: 800 },
    InterviewResponseSchema,
    getFallback
  );
}
