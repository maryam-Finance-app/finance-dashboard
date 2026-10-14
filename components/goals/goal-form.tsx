"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  goalSchema,
  toGoalInput,
  type GoalFormValues,
} from "@/lib/validators/goal";
import {
  useCreateGoal,
  useUpdateGoal,
  type GoalProgress,
} from "@/hooks/useGoals";

import { Button } from "../ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Field, FieldError, FieldGroup, FieldTitle } from "../ui/field";
import { Input } from "../ui/input";

type Props = {
  title: string;
  /** Pass a goal to edit it; leave empty to create a new one. */
  goal?: GoalProgress;
  /** Called after a successful save (use it to close the dialog). */
  onSuccess?: () => void;
};

export default function GoalForm({ title, goal, onSuccess }: Props) {
  const isEdit = !!goal;

  const create = useCreateGoal();
  const update = useUpdateGoal();
  const mutation = isEdit ? update : create;

  const { control, handleSubmit } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: goal?.title ?? "",
      targetAmount: goal ? String(goal.target_amount) : "",
    },
  });

  function submitForm(values: GoalFormValues) {
    const input = toGoalInput(values);

    if (goal) {
      update.mutate({ id: goal.id, input }, { onSuccess });
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
          <Controller
            name="title"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldTitle>Goal name</FieldTitle>
                <Input
                  {...field}
                  id="title"
                  placeholder="e.g. New laptop"
                  aria-invalid={fieldState.invalid}
                  disabled={mutation.isPending}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} className="text-red-600" />
                )}
              </Field>
            )}
          />

          <Controller
            name="targetAmount"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldTitle>Target amount</FieldTitle>
                <Input
                  {...field}
                  id="targetAmount"
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

          {mutation.error && (
            <p className="text-sm text-red-600">{mutation.error.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending
              ? "Saving..."
              : isEdit
                ? "Save changes"
                : "Create goal"}
          </Button>
        </FieldGroup>
      </form>
    </DialogContent>
  );
}