import type { StudentDetails, Job, Internship } from "@/types/database";

export interface CriterionCheck<TRequired = any, TActual = any> {
  name: string;
  passed: boolean;
  required: TRequired;
  actual: TActual;
  message: string;
}

export interface EligibilityResult {
  isEligible: boolean;
  status: "Eligible" | "Not Eligible";
  matchPercentage: number;
  criteria: {
    cgpa: CriterionCheck<number, number | null>;
    qualification: CriterionCheck<string[], string | null>;
    graduationYear: CriterionCheck<number[], number | null>;
    skills: CriterionCheck<string[], string[]>;
    deadline: CriterionCheck<string, string>;
  };
  unmetReasons: string[];
}

export type PlacementListing = Pick<
  Job | Internship,
  | "required_skills"
  | "min_cgpa"
  | "eligible_qualifications"
  | "eligible_courses"
  | "eligible_graduation_years"
  | "application_deadline"
>;

/**
 * Deterministic, rule-based eligibility evaluation service.
 * Compares explicit job/internship criteria against student profile data.
 * Missing student data is strictly treated as unmet/unknown — never guessed.
 */
export function checkEligibility(
  target: PlacementListing,
  student: Partial<StudentDetails> | null | undefined
): EligibilityResult {
  const unmetReasons: string[] = [];
  let passedCount = 0;
  const totalCriteria = 5;

  // 1. Minimum CGPA Check
  const minCgpa = Number(target.min_cgpa || 0);
  const studentCgpa = student?.cgpa !== null && student?.cgpa !== undefined ? Number(student.cgpa) : null;
  let cgpaPassed = false;
  let cgpaMessage = "";

  if (minCgpa <= 0) {
    cgpaPassed = true;
    cgpaMessage = "No minimum CGPA required.";
  } else if (studentCgpa === null) {
    cgpaPassed = false;
    cgpaMessage = `Minimum CGPA of ${minCgpa.toFixed(1)} is required, but your CGPA is not recorded in your profile.`;
    unmetReasons.push(cgpaMessage);
  } else if (studentCgpa < minCgpa) {
    cgpaPassed = false;
    cgpaMessage = `Your CGPA (${studentCgpa.toFixed(2)}) is below the required minimum of ${minCgpa.toFixed(2)}.`;
    unmetReasons.push(cgpaMessage);
  } else {
    cgpaPassed = true;
    cgpaMessage = `CGPA requirement satisfied (${studentCgpa.toFixed(2)} >= ${minCgpa.toFixed(2)}).`;
  }
  if (cgpaPassed) passedCount++;

  // 2. Qualification Check
  const eligibleQualifications = target.eligible_qualifications || [];
  const studentQual = student?.qualification ? student.qualification.trim() : null;
  let qualPassed = false;
  let qualMessage = "";

  if (eligibleQualifications.length === 0) {
    qualPassed = true;
    qualMessage = "Open to all educational qualifications.";
  } else if (!studentQual) {
    qualPassed = false;
    qualMessage = `Eligible qualifications: ${eligibleQualifications.join(", ")}, but qualification is missing in your profile.`;
    unmetReasons.push(qualMessage);
  } else {
    const studentQualLower = studentQual.toLowerCase();
    const matched = eligibleQualifications.some((q) => {
      const qLower = q.trim().toLowerCase();
      return (
        studentQualLower.includes(qLower) ||
        qLower.includes(studentQualLower)
      );
    });

    if (matched) {
      qualPassed = true;
      qualMessage = `Qualification matched (${studentQual}).`;
    } else {
      qualPassed = false;
      qualMessage = `Your qualification (${studentQual}) does not match eligible qualifications: ${eligibleQualifications.join(", ")}.`;
      unmetReasons.push(qualMessage);
    }
  }
  if (qualPassed) passedCount++;

  // 3. Graduation Year Check
  const eligibleYears = target.eligible_graduation_years || [];
  const studentGradYear = student?.graduation_year !== null && student?.graduation_year !== undefined
    ? Number(student.graduation_year)
    : null;
  let gradYearPassed = false;
  let gradYearMessage = "";

  if (eligibleYears.length === 0) {
    gradYearPassed = true;
    gradYearMessage = "Open to all graduation batches.";
  } else if (!studentGradYear) {
    gradYearPassed = false;
    gradYearMessage = `Eligible graduation batches: ${eligibleYears.join(", ")}, but your graduation year is not recorded.`;
    unmetReasons.push(gradYearMessage);
  } else if (!eligibleYears.includes(studentGradYear)) {
    gradYearPassed = false;
    gradYearMessage = `Your graduation batch (${studentGradYear}) is not among eligible batches: ${eligibleYears.join(", ")}.`;
    unmetReasons.push(gradYearMessage);
  } else {
    gradYearPassed = true;
    gradYearMessage = `Graduation batch (${studentGradYear}) eligible.`;
  }
  if (gradYearPassed) passedCount++;

  // 4. Required Technical Skills Check
  const reqSkills = target.required_skills || [];
  const studentSkills = student?.skills || [];
  const normalizedStudentSkills = studentSkills.map((s) => s.toLowerCase().trim());
  const missingSkills: string[] = [];
  const matchedSkills: string[] = [];

  for (const skill of reqSkills) {
    const sLower = skill.toLowerCase().trim();
    if (normalizedStudentSkills.includes(sLower)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  let skillsPassed = false;
  let skillsMessage = "";

  if (reqSkills.length === 0) {
    skillsPassed = true;
    skillsMessage = "No specific prerequisite skills enforced.";
  } else if (missingSkills.length === 0) {
    skillsPassed = true;
    skillsMessage = `All ${reqSkills.length} required skill(s) present in your profile.`;
  } else {
    skillsPassed = false;
    skillsMessage = `Missing required skills: ${missingSkills.join(", ")}.`;
    unmetReasons.push(skillsMessage);
  }
  if (skillsPassed) passedCount++;

  // 5. Application Deadline Check
  const deadlineStr = target.application_deadline;
  const deadlineDate = new Date(deadlineStr);
  const now = new Date();
  const isExpired = !isNaN(deadlineDate.getTime()) && now > deadlineDate;
  let deadlinePassed = false;
  let deadlineMessage = "";

  if (isExpired) {
    deadlinePassed = false;
    deadlineMessage = `The application window closed on ${deadlineDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}.`;
    unmetReasons.push(deadlineMessage);
  } else {
    deadlinePassed = true;
    deadlineMessage = `Application window is open (deadline: ${deadlineDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}).`;
  }
  if (deadlinePassed) passedCount++;

  const isEligible = unmetReasons.length === 0;
  const matchPercentage = Math.round((passedCount / totalCriteria) * 100);

  return {
    isEligible,
    status: isEligible ? "Eligible" : "Not Eligible",
    matchPercentage,
    criteria: {
      cgpa: {
        name: "Minimum CGPA / Marks",
        passed: cgpaPassed,
        required: minCgpa,
        actual: studentCgpa,
        message: cgpaMessage,
      },
      qualification: {
        name: "Degree & Qualification",
        passed: qualPassed,
        required: eligibleQualifications,
        actual: studentQual,
        message: qualMessage,
      },
      graduationYear: {
        name: "Graduation Batch",
        passed: gradYearPassed,
        required: eligibleYears,
        actual: studentGradYear,
        message: gradYearMessage,
      },
      skills: {
        name: "Required Technical Skills",
        passed: skillsPassed,
        required: reqSkills,
        actual: studentSkills,
        message: skillsMessage,
      },
      deadline: {
        name: "Application Deadline",
        passed: deadlinePassed,
        required: deadlineStr,
        actual: now.toISOString(),
        message: deadlineMessage,
      },
    },
    unmetReasons,
  };
}
