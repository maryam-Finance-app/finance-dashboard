"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils";
import {
  todayLocalISO,
  toTransactionInput,
  transactionSchema,
  type TransactionFormValues,
} from "@/lib/validators/transaction";
import {
  useCreateTransaction,
  useUpdateTransaction,
  type Transaction,
  type TransactionType,
} from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useGoals } from "@/hooks/useGoals";

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
  const { data: goals = [], isLoading: loadingGoals } = useGoals();

  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const mutation = isEdit ? update : create;

  const { control, handleSubmit, setValue, clearErrors, watch } =
    useForm<TransactionFormValues>({
      resolver: zodResolver(transactionSchema),
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
  const isSavings = type === "savings";

  // A category only fits its own type, so only offer matching ones
  const typeCategories = categories.filter((category) => category.type === type);

  // Hide goals that were already bought, but keep the one this
  // transaction is already linked to so editing it still works
  const availableGoals = goals.filter(
    (goal) => !goal.purchased_at || goal.id === transaction?.goal?.id
  );

  function changeType(next: TransactionType) {
    setValue("type", next);
    // The old category/goal no longer applies to the new type
    setValue("categoryId", "");
    setValue("goalId", "");
    clearErrors(["categoryId", "goalId"]);
  }

  function submitForm(values: TransactionFormValues) {
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-600" />
                )}
              </Field>
            )}
          />

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
                        {goal.title}
                      </option>
                    ))}
                  </select>
                  {!loadingGoals && availableGoals.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      You have no active goals yet. Create one on the Goals page first.
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
            <p className="text-sm text-red-600">{mutation.error.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
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