import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be less than 100 characters"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
    course: z
      .string()
      .min(2, "Course / Degree is required (e.g., B.Tech, MCA, B.Sc)"),
    qualification: z
      .string()
      .min(2, "Highest qualification level is required (e.g., Undergraduate, Postgraduate)"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const recruiterRegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be less than 100 characters"),
    email: z
      .string()
      .email("Please enter a valid work email address")
      .toLowerCase()
      .trim(),
    companyName: z
      .string()
      .min(2, "Company / Organization name must be at least 2 characters")
      .max(100, "Company name must be less than 100 characters"),
    designation: z
      .string()
      .min(2, "Designation / Role title is required (e.g., Campus Recruiter, Talent Lead)")
      .max(100, "Designation must be less than 100 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RecruiterRegisterInput = z.infer<typeof recruiterRegisterSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  token: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must only contain numbers"),
  type: z.enum(["signup", "email", "recovery", "magiclink"]).default("signup"),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const studentProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  college: z.string().optional().nullable(),
  course: z.string().min(2, "Course is required"),
  qualification: z.string().min(2, "Qualification is required"),
  branch: z.string().optional().nullable(),
  graduationYear: z.coerce
    .number()
    .min(1990)
    .max(2100)
    .optional()
    .nullable(),
  cgpa: z.coerce.number().min(0).max(10).optional().nullable(),
  githubUsername: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  skills: z.string().optional(),
  softSkills: z.string().optional(),
  projectsJson: z.string().optional(),
  experienceJson: z.string().optional(),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
