"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import {
  createTransactionSchema,
  todayLocalISO,
  type GoalLimit,
  toTransactionInput,
  type TransactionFormValues,
} from "@/lib/validators/transaction";
import {
  useCreateTransaction,
  useUpdateTransaction,
  type Transaction,
  type TransactionType,
} from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useGoalProgress } from "@/hooks/useGoals";

import { Button } from "../ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Field, FieldError, FieldGroup, FieldTitle } from "../ui/field";
import { Input } from "../ui/input";

const TYPES: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "savings", label: "Savings" },
];

// Same look as <Input>, for a native <select>
const selectClass = cn(
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-destructive"
);

// Turns the database's limit errors into plain language, in case one gets
// past the form (for example another tab saved toward the same goal first)
function friendlyError(message: string) {
  if (message.includes("already complete") || message.includes("already been purchased"))
    return "This goal can't take more savings anymore. Refresh and pick another goal.";
  if (message.includes("left to reach"))
    return `${message}. Someone may have saved toward this goal in the meantime, so lower the amount and try again.`;
  return message;
}

type Props = {
  title: string;
  /** Pass a transaction to edit it; leave empty to add a new one. */
  transaction?: Transaction;
  /** Called after a successful save (use it to close the dialog). */
  onSuccess?: () => void;
};

export default function TransactionForm({ title, transaction, onSuccess }: Props) {
  const isEdit = !!transaction;

  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  // Goals with their saved amount, so we know how much each one can still take
  const { data: goals = [], isLoading: loadingGoals } = useGoalProgress();

  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const mutation = isEdit ? update : create;

  // How much more a goal can take. When editing, this transaction's own
  // amount counts as free again, because it is being replaced.
  const getGoalLimit = useCallback(
    (goalId: string): GoalLimit | undefined => {
      const goal = goals.find((item) => item.id === goalId);
      if (!goal) return undefined;

      const ownAmount = transaction?.goal?.id === goalId ? transaction.amount : 0;
      const remaining = goal.target_amount - goal.saved_amount + ownAmount;

      // rounded to avoid floating point noise
      return { title: goal.title, remaining: Math.round(remaining * 100) / 100 };
    },
    [goals, transaction]
  );

  const getRemaining = (goalId: string) => getGoalLimit(goalId)?.remaining;

  const schema = useMemo(() => createTransactionSchema(getGoalLimit), [getGoalLimit]);

  const {
    control,
    handleSubmit,
    setValue,
    clearErrors,
    trigger,
    watch,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange", // check while typing, not only on submit
    defaultValues: {
      type: transaction?.type ?? "expense",
      amount: transaction ? String(transaction.amount) : "",
      date: transaction?.date ?? todayLocalISO(),
      categoryId: transaction?.category?.id ?? "",
      goalId: transaction?.goal?.id ?? "",
      note: transaction?.note ?? "",
    },
  });

  const type = watch("type");
  const goalId = watch("goalId");
  const amount = watch("amount");
  const isSavings = type === "savings";

  // A category only fits its own type, so only offer matching ones
  const typeCategories = categories.filter((category) => category.type === type);

  // Goals that can still take savings: not bought and not yet complete.
  // The goal this transaction already belongs to stays, so editing it works.
  const availableGoals = goals.filter(
    (goal) =>
      !goal.purchased_at &&
      (!goal.is_completed || goal.id === transaction?.goal?.id)
  );

  const remaining = goalId ? getRemaining(goalId) : undefined;

  // The limit depends on the chosen goal (and on the goals data once it has
  // loaded), so check the amount again when either changes
  useEffect(() => {
    if (amount) void trigger("amount");
  }, [goalId, schema, amount, trigger]);

  // Never let an over-limit savings transaction be sent
  const overLimit =
    isSavings &&
    remaining !== undefined &&
    Number(amount) > remaining &&
    Number.isFinite(Number(amount));

  function changeType(next: TransactionType) {
    setValue("type", next);
    // The old category/goal no longer applies to the new type
    setValue("categoryId", "");
    setValue("goalId", "");
    clearErrors(["categoryId", "goalId", "amount"]);
  }

  function submitForm(values: TransactionFormValues) {
    if (overLimit) return; // safety net; the schema already blocks this
    const input = toTransactionInput(values);

    if (transaction) {
      update.mutate({ id: transaction.id, input }, { onSuccess });
    } else {
      create.mutate(input, { onSuccess });
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(submitForm)} noValidate>
        <FieldGroup>
          {/* Type */}
          <Field>
            <FieldTitle>Type</FieldTitle>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={type === option.value ? "default" : "outline"}
                  aria-pressed={type === option.value}
                  disabled={mutation.isPending}
                  onClick={() => changeType(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </Field>

          {/* Category (income / expense) or Save toward (savings) */}
          {isSavings ? (
            <Controller
              name="goalId"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldTitle>Save toward</FieldTitle>
                  <select
                    {...field}
                    id="goalId"
                    className={selectClass}
                    aria-invalid={fieldState.invalid}
                    disabled={mutation.isPending || loadingGoals}
                  >
                    <option value="" disabled>
                      {loadingGoals ? "Loading goals..." : "Choose a goal"}
                    </option>
                    {availableGoals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title} ({formatCurrency(getRemaining(goal.id) ?? 0)} left)
                      </option>
                    ))}
                  </select>
                  {!loadingGoals && availableGoals.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      You have no goals that can take savings. Create a new goal on
                      the Goals page, or buy the ones you have completed.
                    </p>
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} className="text-red-600" />
                  )}
                </Field>
              )}
            />
          ) : (
            <Controller
              name="categoryId"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldTitle>Category</FieldTitle>
                  <select
                    {...field}
                    id="categoryId"
                    className={selectClass}
                    aria-invalid={fieldState.invalid}
                    disabled={mutation.isPending || loadingCategories}
                  >
                    <option value="" disabled>
                      {loadingCategories ? "Loading categories..." : "Choose a category"}
                    </option>
                    {typeCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} className="text-red-600" />
                  )}
                </Field>
              )}
            />
          )}

          {/* Amount */}
          <Controller
            name="amount"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldTitle>Amount</FieldTitle>
                <Input
                  {...field}
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  aria-invalid={fieldState.invalid}
                  disabled={mutation.isPending}
                />
                {isSavings && remaining !== undefined && !fieldState.invalid && (
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(remaining)} left to reach this goal
                  </p>
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-600" />
                )}
              </Field>
            )}
          />

          {/* Date */}
          <Controller
            name="date"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldTitle>Date</FieldTitle>
                <Input
                  {...field}
                  id="date"
                  type="date"
                  aria-invalid={fieldState.invalid}
                  disabled={mutation.isPending}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-600" />
                )}
              </Field>
            )}
          />

          {/* Note (optional) */}
          <Controller
            name="note"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldTitle>Note (optional)</FieldTitle>
                <Input
                  {...field}
                  id="note"
                  placeholder="What was this for?"
                  aria-invalid={fieldState.invalid}
                  disabled={mutation.isPending}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-600" />
                )}
              </Field>
            )}
          />

          {mutation.error && (
            <p className="text-sm text-red-600">
              {friendlyError(mutation.error.message)}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending || overLimit || !!errors.amount}
          >
            {mutation.isPending
              ? "Saving..."
              : isEdit
                ? "Save changes"
                : "Add transaction"}
          </Button>
        </FieldGroup>
      </form>
    </DialogContent>
  );
}