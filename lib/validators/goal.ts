import { z } from "zod";

export const goalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give your goal a name")
    .max(60, "At most 60 characters"),
  // Kept as a string in the form; converted to a number on submit.
  // numeric(12,2) allows up to 10 digits before the decimal point.
  targetAmount: z
    .string()
    .trim()
    .min(1, "Target amount is required")
    .regex(/^\d{1,10}(\.\d{1,2})?$/, "Enter a valid amount (max 2 decimals)")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
});

export type GoalFormValues = z.infer<typeof goalSchema>;

/** Form values -> database row. */
export function toGoalInput(values: GoalFormValues) {
  return {
    title: values.title,
    target_amount: Number(values.targetAmount),
  };
}