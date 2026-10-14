import { z } from "zod";
import { formatCurrency } from "@/lib/format";

export type GoalLimit = { title: string; remaining: number };

/**
 * Builds the transaction schema.
 *
 * `getGoalLimit(goalId)` returns the goal's title and how much more it can
 * take (target minus saved), or `undefined` when that isn't known yet.
 * It is used to block savings above that limit. Without it, only the
 * basic rules are checked.
 */
export function createTransactionSchema(
  getGoalLimit?: (goalId: string) => GoalLimit | undefined
) {
  return z
    .object({
      type: z.enum(["income", "expense", "savings"]),
      // Kept as a string in the form; converted to a number on submit.
      // numeric(12,2) allows up to 10 digits before the decimal point.
      amount: z
        .string()
        .trim()
        .min(1, "Amount is required")
        .regex(/^\d{1,10}(\.\d{1,2})?$/, "Enter a valid amount (max 2 decimals)")
        .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
      date: z.string().min(1, "Pick a date"),
      // "" means "nothing selected yet"
      categoryId: z.string(),
      goalId: z.string(),
      note: z.string().trim().max(200, "At most 200 characters"),
    })
    .superRefine((values, ctx) => {
      // Business rules: income/expense need a category, savings need a goal
      if (values.type === "savings") {
        if (!values.goalId) {
          ctx.addIssue({
            code: "custom",
            path: ["goalId"],
            message: "Choose a goal to save toward",
          });
          return;
        }

        // Savings can't go past the goal's target
        const limit = getGoalLimit?.(values.goalId);
        const amount = Number(values.amount);

        if (limit && Number.isFinite(amount) && amount > limit.remaining) {
          ctx.addIssue({
            code: "custom",
            path: ["amount"],
            message:
              limit.remaining <= 0
                ? `"${limit.title}" has already reached its target, so you can't add more savings to it.`
                : `That's more than "${limit.title}" needs. Only ${formatCurrency(limit.remaining)} is left to reach its target, so enter ${formatCurrency(limit.remaining)} or less.`,
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
}

// Basic rules only (no goal limit)
export const transactionSchema = createTransactionSchema();

export type TransactionFormValues = z.infer<typeof transactionSchema>;

/** Today as "YYYY-MM-DD" in the user's local time (toISOString would use UTC). */
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