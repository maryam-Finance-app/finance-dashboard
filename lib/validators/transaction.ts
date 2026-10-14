import { z } from "zod";

export const transactionSchema = z
  .object({
    type: z.enum(["income", "expense", "savings"]),
    amount: z
      .string()
      .trim()
      .min(1, "Amount is required")
      .regex(/^\d{1,10}(\.\d{1,2})?$/, "Enter a valid amount (max 2 decimals)")
      .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
    date: z.string().min(1, "Pick a date"),
    categoryId: z.string(),
    goalId: z.string(),
    note: z.string().trim().max(200, "At most 200 characters"),
  })
  .superRefine((values, ctx) => {
    if (values.type === "savings") {
      if (!values.goalId) {
        ctx.addIssue({
          code: "custom",
          path: ["goalId"],
          message: "Choose a goal to save toward",
        });
      }
    } else if (!values.categoryId) {
      ctx.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Choose a category",
      });
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export function todayLocalISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function toTransactionInput(values: TransactionFormValues) {
  const isSavings = values.type === "savings";

  return {
    type: values.type,
    amount: Number(values.amount),
    date: values.date,
    note: values.note ? values.note : null,
    category_id: isSavings ? null : values.categoryId,
    goal_id: isSavings ? values.goalId : null,
  };
}