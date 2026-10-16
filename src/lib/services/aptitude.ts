import { z } from "zod";
import type {
  AptitudeCategory,
  AptitudeDifficulty,
  AptitudeQuestion,
  PublicAptitudeQuestion,
} from "@/types/database";
import { executeStructuredCompletion } from "./openai";

export const GeneratedQuestionSchema = z.object({
  question_text: z.string(),
  options: z.array(z.string()).length(4),
  correct_option: z.number().int().min(0).max(3),
  explanation: z.string(),
});

export const GeneratedQuestionsListSchema = z.object({
  questions: z.array(GeneratedQuestionSchema),
});

// Curated question bank guaranteeing rich, offline tests across all 6 categories
export const CURATED_QUESTION_BANK: Record<
  AptitudeCategory,
  Record<AptitudeDifficulty, z.infer<typeof GeneratedQuestionSchema>[]>
> = {
  logical: {
    beginner: [
      {
        question_text: "Which number comes next in the sequence: 2, 4, 8, 16, ___?",
        options: ["24", "30", "32", "36"],
        correct_option: 2,
        explanation: "Each number is multiplied by 2 (geometric progression with ratio 2): 16 * 2 = 32.",
      },
      {
        question_text: "Find the odd one out: Apple, Mango, Carrot, Banana.",
        options: ["Apple", "Mango", "Carrot", "Banana"],
        correct_option: 2,
        explanation: "Carrot is a root vegetable, whereas Apple, Mango, and Banana are fruits.",
      },
      {
        question_text: "If CLOCK is coded as KCOLC, how is WATCH coded?",
        options: ["HCTAW", "TAWCH", "HCAWT", "WAHCT"],
        correct_option: 0,
        explanation: "The letters of the word are reversed: W-A-T-C-H reversed is H-C-T-A-W.",
      },
      {
        question_text: "Pointing to a photograph, a man said: 'She is the daughter of my grandfather's only son.' How is the woman related to the man?",
        options: ["Mother", "Sister", "Aunt", "Daughter"],
        correct_option: 1,
        explanation: "Grandfather's only son is the man's father. The daughter of the man's father is his sister.",
      },
      {
        question_text: "Statements: All roses are flowers. Some flowers fade quickly. Conclusion: Some roses fade quickly.",
        options: ["Definitely True", "Definitely False", "Cannot be determined", "Both true and false"],
        correct_option: 2,
        explanation: "Since only 'some' flowers fade quickly, we cannot ascertain whether roses belong to that subset.",
      },
    ],
    intermediate: [
      {
        question_text: "Complete the series: 3, 7, 15, 31, 63, ___?",
        options: ["95", "112", "127", "128"],
        correct_option: 2,
        explanation: "The pattern is (x * 2) + 1. 63 * 2 + 1 = 127.",
      },
      {
        question_text: "In a certain code, '786' means 'study very hard', '958' means 'hard work pays', and '645' means 'study and work'. Which digit stands for 'very'?",
        options: ["7", "8", "6", "9"],
        correct_option: 0,
        explanation: "Comparing 786 and 958 gives 'hard' = 8. Comparing 786 and 645 gives 'study' = 6. Thus, 'very' = 7.",
      },
    ],
    advanced: [
      {
        question_text: "Five friends A, B, C, D, and E are seated around a circular table facing the center. A sits second to the left of C. B sits adjacent to both A and D. Who sits to the immediate right of C?",
        options: ["A", "D", "E", "B"],
        correct_option: 2,
        explanation: "Arranging A, B, D, C, E sequentially satisfies all relative positioning conditions, placing E immediately to the right of C.",
      },
    ],
  },
  quantitative: {
    beginner: [
      {
        question_text: "A train running at 72 km/h crosses a 200m platform in 25 seconds. What is the length of the train?",
        options: ["250 m", "300 m", "350 m", "400 m"],
        correct_option: 1,
        explanation: "Speed in m/s = 72 * (5/18) = 20 m/s. Total distance = Speed * Time = 20 * 25 = 500 m. Train length = 500 - 200 = 300 m.",
      },
      {
        question_text: "If an item is bought for $400 and sold for $480, what is the profit percentage?",
        options: ["15%", "18%", "20%", "25%"],
        correct_option: 2,
        explanation: "Profit = 480 - 400 = 80. Profit percentage = (80 / 400) * 100 = 20%.",
      },
      {
        question_text: "A and B together can do a piece of work in 12 days, while A alone can do it in 20 days. How many days will B alone take?",
        options: ["25 days", "30 days", "32 days", "36 days"],
        correct_option: 1,
        explanation: "1/B = 1/12 - 1/20 = (5 - 3)/60 = 2/60 = 1/30. So B takes 30 days.",
      },
      {
        question_text: "The average of five consecutive numbers is 27. What is the largest number?",
        options: ["27", "28", "29", "30"],
        correct_option: 2,
        explanation: "The consecutive numbers centered at average 27 are 25, 26, 27, 28, 29. The largest is 29.",
      },
      {
        question_text: "What is 15% of 60% of 500?",
        options: ["35", "40", "45", "50"],
        correct_option: 2,
        explanation: "60% of 500 = 300. 15% of 300 = 45.",
      },
    ],
    intermediate: [
      {
        question_text: "Two pipes A and B can fill a tank in 15 hours and 20 hours respectively. If both pipes are opened simultaneously, how long does it take to fill the tank?",
        options: ["8 hours 34 min", "8 hours 45 min", "9 hours", "10 hours"],
        correct_option: 0,
        explanation: "Combined rate = 1/15 + 1/20 = 7/60. Time = 60/7 = 8 hours and (4/7)*60 ≈ 34.3 minutes.",
      },
    ],
    advanced: [
      {
        question_text: "A sum of money doubles itself in 5 years at simple interest. In how many years will it become 8 times itself at the same rate?",
        options: ["25 years", "30 years", "35 years", "40 years"],
        correct_option: 2,
        explanation: "Interest earned = 1P in 5 years => Rate = 20%. To become 8 times, interest = 7P. Time = 7 / 0.20 = 35 years.",
      },
    ],
  },
  mathematics: {
    beginner: [
      {
        question_text: "What is the value of x if 2x + 7 = 19?",
        options: ["4", "5", "6", "7"],
        correct_option: 2,
        explanation: "2x = 19 - 7 = 12 => x = 6.",
      },
      {
        question_text: "What is the area of a circle with radius 7 cm? (Use π = 22/7)",
        options: ["144 cm²", "154 cm²", "164 cm²", "176 cm²"],
        correct_option: 1,
        explanation: "Area = π * r² = (22/7) * 7 * 7 = 154 cm².",
      },
      {
        question_text: "What is the slope of the line passing through (2, 3) and (6, 11)?",
        options: ["1.5", "2", "2.5", "3"],
        correct_option: 1,
        explanation: "Slope m = (y2 - y1) / (x2 - x1) = (11 - 3) / (6 - 2) = 8 / 4 = 2.",
      },
      {
        question_text: "Simplify: (a³ * a⁵) / a²",
        options: ["a⁴", "a⁵", "a⁶", "a⁷"],
        correct_option: 2,
        explanation: "a^(3 + 5 - 2) = a^6.",
      },
      {
        question_text: "The roots of the equation x² - 5x + 6 = 0 are:",
        options: ["1 and 6", "2 and 3", "-2 and -3", "3 and 4"],
        correct_option: 1,
        explanation: "(x - 2)(x - 3) = 0 => x = 2 or x = 3.",
      },
    ],
    intermediate: [
      {
        question_text: "What is the derivative of f(x) = 3x² + 5x - 8?",
        options: ["6x + 5", "3x + 5", "6x - 8", "6x² + 5"],
        correct_option: 0,
        explanation: "d/dx(3x²) = 6x, d/dx(5x) = 5, d/dx(-8) = 0. f'(x) = 6x + 5.",
      },
    ],
    advanced: [
      {
        question_text: "What is the determinant of matrix [[2, 4], [1, 5]]?",
        options: ["6", "7", "8", "10"],
        correct_option: 0,
        explanation: "Det = (2 * 5) - (4 * 1) = 10 - 4 = 6.",
      },
    ],
  },
  verbal: {
    beginner: [
      {
        question_text: "Choose the synonym for 'Candid':",
        options: ["Deceptive", "Frank", "Reserved", "Shy"],
        correct_option: 1,
        explanation: "'Candid' means truthful, straightforward, and frank.",
      },
      {
        question_text: "Choose the antonym for 'Obsolete':",
        options: ["Archaic", "Outdated", "Modern", "Vague"],
        correct_option: 2,
        explanation: "'Obsolete' means no longer produced or used; its opposite is modern.",
      },
      {
        question_text: "Identify the correct sentence:",
        options: [
          "Neither of the boys were present.",
          "Neither of the boys was present.",
          "Neither of the boys are present.",
          "Neither of the boys have been present.",
        ],
        correct_option: 1,
        explanation: "'Neither' is a singular pronoun and takes a singular verb 'was'.",
      },
      {
        question_text: "Fill in the blank: She has been working here _____ five years.",
        options: ["since", "for", "from", "during"],
        correct_option: 1,
        explanation: "We use 'for' with a duration of time (five years), and 'since' with a specific start point.",
      },
      {
        question_text: "Meaning of the idiom: 'Bite the bullet'",
        options: [
          "To eat something dangerous",
          "To face a difficult situation with courage",
          "To act foolishly",
          "To win a conflict",
        ],
        correct_option: 1,
        explanation: "'Bite the bullet' means enduring a painful or grim situation bravely.",
      },
    ],
    intermediate: [
      {
        question_text: "Select the word spelled correctly:",
        options: ["Accomodate", "Acommodate", "Accommodate", "Acomodate"],
        correct_option: 2,
        explanation: "'Accommodate' has double 'c' and double 'm'.",
      },
    ],
    advanced: [
      {
        question_text: "Choose the word closest in meaning to 'Fastidious':",
        options: ["Careless", "Meticulous", "Rapid", "Humble"],
        correct_option: 1,
        explanation: "'Fastidious' means very attentive to and concerned about accuracy and detail; meticulous.",
      },
    ],
  },
  problem_solving: {
    beginner: [
      {
        question_text: "You have 8 balls of identical look, but 1 is slightly heavier. What is the minimum number of balance scale weighings needed to find the heavy ball?",
        options: ["1", "2", "3", "4"],
        correct_option: 1,
        explanation: "Divide into 3 groups (3, 3, 2). Weigh 3 against 3. If equal, weigh the remaining 2. If unequal, weigh 1 against 1 from the heavier 3. Minimum 2 weighings.",
      },
      {
        question_text: "If 5 machines take 5 minutes to make 5 widgets, how long would 100 machines take to make 100 widgets?",
        options: ["100 minutes", "50 minutes", "5 minutes", "1 minute"],
        correct_option: 2,
        explanation: "1 machine makes 1 widget in 5 minutes. Therefore, 100 machines working in parallel make 100 widgets in 5 minutes.",
      },
      {
        question_text: "A doctor gives you 3 pills and tells you to take one every half hour. How long will the pills last?",
        options: ["1.5 hours", "1 hour", "45 minutes", "30 minutes"],
        correct_option: 1,
        explanation: "Take 1st pill at 0 min, 2nd pill at 30 min, and 3rd pill at 60 min (1 hour total).",
      },
      {
        question_text: "A bat and ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?",
        options: ["$0.10", "$0.05", "$0.15", "$0.01"],
        correct_option: 1,
        explanation: "Let ball = x. Bat = x + 1.00. x + x + 1.00 = 1.10 => 2x = 0.10 => x = $0.05.",
      },
      {
        question_text: "In a race, you overtake the runner in 2nd place. What position are you in now?",
        options: ["1st", "2nd", "3rd", "None"],
        correct_option: 1,
        explanation: "You took the place of the runner in 2nd, so you are now in 2nd place.",
      },
    ],
    intermediate: [
      {
        question_text: "You have two jugs: 3 liters and 5 liters, with an unlimited water supply. How can you measure exactly 4 liters?",
        options: [
          "Fill 5L, pour into 3L, empty 3L, pour 2L into 3L, fill 5L, fill remaining 1L in 3L jug",
          "Fill 3L twice into 5L",
          "Impossible with these jugs",
          "Fill 5L halfway",
        ],
        correct_option: 0,
        explanation: "Following step 1 leaves exactly 4 liters in the 5L jug.",
      },
    ],
    advanced: [
      {
        question_text: "There are 100 prisoners numbered 1 to 100 in a room. Using the optimal cycle-following strategy for the 100 prisoners problem, the probability of all surviving exceeds:",
        options: ["0.0001%", "5%", "31%", "50%"],
        correct_option: 2,
        explanation: "The loop strategy gives a survival probability of 1 - ln(2) ≈ 31.18%.",
      },
    ],
  },
  technical: {
    beginner: [
      {
        question_text: "What is the time complexity of searching for an element in a balanced Binary Search Tree (BST)?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correct_option: 1,
        explanation: "In a balanced BST with n nodes, the height is O(log n), so search takes O(log n).",
      },
      {
        question_text: "Which HTTP status code signifies that a resource was successfully created?",
        options: ["200 OK", "201 Created", "204 No Content", "301 Moved"],
        correct_option: 1,
        explanation: "HTTP 201 indicates a request succeeded and led to resource creation.",
      },
      {
        question_text: "In SQL, which constraint guarantees that all values in a column are distinct?",
        options: ["PRIMARY KEY", "FOREIGN KEY", "UNIQUE", "NOT NULL"],
        correct_option: 2,
        explanation: "The UNIQUE constraint ensures all values in a column or set of columns are distinct.",
      },
      {
        question_text: "Which data structure follows the First-In, First-Out (FIFO) principle?",
        options: ["Stack", "Queue", "Tree", "Graph"],
        correct_option: 1,
        explanation: "A Queue operates on FIFO, where elements are inserted at rear and removed from front.",
      },
      {
        question_text: "What does CSS stand for?",
        options: [
          "Computer Style Sheets",
          "Cascading Style Sheets",
          "Creative Style Sheets",
          "Colorful Style Sheets",
        ],
        correct_option: 1,
        explanation: "CSS stands for Cascading Style Sheets.",
      },
    ],
    intermediate: [
      {
        question_text: "What is the primary difference between synchronous and asynchronous code execution in JavaScript?",
        options: [
          "Asynchronous code blocks the main thread",
          "Asynchronous code delegates non-blocking operations to the event loop",
          "Synchronous code runs in parallel web workers",
          "There is no performance difference",
        ],
        correct_option: 1,
        explanation: "Asynchronous JavaScript leverages the event loop and background APIs to execute non-blocking I/O.",
      },
    ],
    advanced: [
      {
        question_text: "In database concurrency, which isolation level prevents Dirty Reads, Non-repeatable Reads, and Phantom Reads?",
        options: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
        correct_option: 3,
        explanation: "Serializable is the highest isolation level and prevents all three concurrency anomalies.",
      },
    ],
  },
};

/**
 * Strips correct answers and explanations before sending to the browser.
 * Protects test integrity and prevents client inspect cheating.
 */
export function sanitizeQuestionsForClient(
  questions: AptitudeQuestion[]
): PublicAptitudeQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    test_id: q.test_id,
    question_text: q.question_text,
    options: q.options,
    order_index: q.order_index,
  }));
}

/**
 * Generates questions using OpenAI gpt-4o-mini or falls back to curated verified question banks.
 */
export async function generateAptitudeQuestions(
  category: AptitudeCategory,
  difficulty: AptitudeDifficulty,
  count: number = 5
): Promise<{
  success: boolean;
  questions: z.infer<typeof GeneratedQuestionSchema>[];
  isFallback: boolean;
}> {
  const getFallback = () => {
    const list = [
      ...(CURATED_QUESTION_BANK[category]?.[difficulty] || []),
      ...(CURATED_QUESTION_BANK[category]?.beginner || []),
      ...(CURATED_QUESTION_BANK.technical.beginner || []),
    ];
    return { questions: list.slice(0, count) };
  };

  const systemPrompt = `You are an expert assessment examiner for campus placement drives.
Generate exactly ${count} multiple-choice questions for the following category: "${category}" at "${difficulty}" difficulty.
For each question, provide:
- "question_text": Clear problem statement.
- "options": An array of exactly 4 plausible choices.
- "correct_option": The zero-based index (0, 1, 2, or 3) of the correct choice.
- "explanation": Comprehensive step-by-step rationale for why that option is correct.
Output MUST be a valid JSON object matching the requested schema: { "questions": [...] }.`;

  const userPrompt = `Generate ${count} ${difficulty} level multiple-choice questions for ${category} assessment.`;

  const result = await executeStructuredCompletion(
    { systemPrompt, userPrompt, temperature: 0.3 },
    GeneratedQuestionsListSchema,
    getFallback
  );

  if (result.success && result.data?.questions && result.data.questions.length > 0) {
    return {
      success: true,
      questions: result.data.questions.slice(0, count),
      isFallback: Boolean(result.isFallback),
    };
  }

  const fallbackData = getFallback();
  return {
    success: true,
    questions: fallbackData.questions,
    isFallback: true,
  };
}

export interface GradedResult {
  score: number;
  totalQuestions: number;
  correctCount: number;
  passed: boolean;
  timeSpentSeconds: number;
  breakdown: {
    questionId: string;
    questionText: string;
    options: string[];
    userAnswer: number | null;
    correctOption: number;
    isCorrect: boolean;
    explanation: string;
  }[];
}

/**
 * Deterministically grades student answers strictly on the server.
 * Never allows client-side grading or tampering.
 */
export function gradeTestAnswers(
  questions: AptitudeQuestion[],
  userAnswers: Record<string, number>,
  timeSpentSeconds: number
): GradedResult {
  const totalQuestions = questions.length;
  let correctCount = 0;

  const breakdown = questions.map((q) => {
    const userSelected = userAnswers[q.id] !== undefined ? Number(userAnswers[q.id]) : null;
    const isCorrect = userSelected !== null && userSelected === q.correct_option;

    if (isCorrect) {
      correctCount++;
    }

    return {
      questionId: q.id,
      questionText: q.question_text,
      options: q.options,
      userAnswer: userSelected,
      correctOption: q.correct_option,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = score >= 60; // 60% passing benchmark

  return {
    score,
    totalQuestions,
    correctCount,
    passed,
    timeSpentSeconds,
    breakdown,
  };
}
