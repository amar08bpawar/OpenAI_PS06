import OpenAI from "openai";
import { z } from "zod";

if (typeof window !== "undefined") {
  throw new Error("OpenAI service must strictly execute in server runtime only.");
}

let openaiClientInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes("placeholder") || apiKey.trim() === "") {
    return null;
  }
  if (!openaiClientInstance) {
    openaiClientInstance = new OpenAI({
      apiKey: apiKey.trim(),
      timeout: 30000, // 30s timeout
      maxRetries: 2,
    });
  }
  return openaiClientInstance;
}

export function hasValidOpenAIConfig(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  return Boolean(apiKey && !apiKey.includes("placeholder") && apiKey.trim().length > 10);
}

export interface ChatCompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Executes a gpt-4o-mini completion with safety boundaries, timeouts, and JSON parsing.
 */
export async function executeStructuredCompletion<T>(
  options: ChatCompletionOptions,
  schema: z.ZodSchema<T>,
  fallbackGenerator?: () => T
): Promise<{ success: boolean; data?: T; error?: string; isFallback?: boolean }> {
  const client = getOpenAIClient();

  if (!client) {
    if (fallbackGenerator) {
      return {
        success: true,
        data: fallbackGenerator(),
        isFallback: true,
      };
    }
    return {
      success: false,
      error: "OPENAI_API_KEY is not configured on the server. Please supply a valid key in .env.local.",
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response received from OpenAI gpt-4o-mini.");
    }

    const parsedJson = JSON.parse(content);
    const validated = schema.parse(parsedJson);

    return {
      success: true,
      data: validated,
      isFallback: false,
    };
  } catch (err: any) {
    // If rate limited, quota exceeded, malformed response, or network timeout: use fallback if available
    if (fallbackGenerator) {
      const isRecoverableError =
        err?.status === 429 ||
        err?.status === 500 ||
        err?.status === 503 ||
        err?.message?.includes("quota") ||
        err?.code === "insufficient_quota" ||
        err instanceof SyntaxError ||
        err instanceof z.ZodError ||
        err?.name === "APIConnectionTimeoutError" ||
        err?.code === "ETIMEDOUT";

      if (isRecoverableError) {
        return {
          success: true,
          data: fallbackGenerator(),
          isFallback: true,
        };
      }
    }

    const safeMessage = err instanceof z.ZodError
      ? `Validation failed on AI response: ${err.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")}`
      : err?.message || "OpenAI request failed.";

    return {
      success: false,
      error: safeMessage,
    };
  }
}
