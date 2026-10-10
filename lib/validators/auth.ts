import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Only letters, numbers and underscores are allowed"
    ),
  email,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;