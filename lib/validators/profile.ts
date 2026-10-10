import { z } from "zod";
import { signupSchema } from "./auth";

// Reuse the signup rules so username/password requirements live in one place
export const usernameSchema = signupSchema.pick({ username: true });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: signupSchema.shape.password,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });

export type UsernameValues = z.infer<typeof usernameSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;