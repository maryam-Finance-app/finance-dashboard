"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { useBuyGoal, type GoalProgress } from "@/hooks/useGoals";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

// Same look as <Input>, for a native <select>
const selectClass = cn(
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

/**
 * Confirmation dialog for "buying" a completed goal: it adds an expense
 * transaction for the goal's target amount and marks the goal as purchased.
 * It is open whenever `goal` is set; clearing it (onClose) closes it.
 */
export default function BuyGoal({
  goal,
  onClose,
}: {
  goal: GoalProgress | null;
  onClose: () => void;
}) {
  const buy = useBuyGoal();
  const { data: categories = [], isLoading: loadingCategories } = useCategories();

  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );
  const othersId =
    expenseCategories.find((category) => category.name === "Others")?.id ?? "";

  // "" means the user hasn't picked one, so fall back to "Others"
  const [categoryId, setCategoryId] = useState("");
  const selected = categoryId || othersId;

  function close() {
    buy.reset(); // clear any previous error
    setCategoryId("");
    onClose();
  }

  function handleBuy() {
    if (!goal) return;
    buy.mutate(
      { goalId: goal.id, categoryId: selected || null },
      { onSuccess: close }
    );
  }

  return (
    <Dialog
      open={!!goal}
      onOpenChange={(open) => {
        // Don't let the dialog close while the request is running
        if (!open && !buy.isPending) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy Goal</DialogTitle>
          <DialogDescription>
            {goal
              ? `Mark "${goal.title}" as purchased? Its savings entries will be replaced by a single expense of ${formatCurrency(goal.target_amount)}.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label htmlFor="buy-category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="buy-category"
            className={selectClass}
            value={selected}
            onChange={(event) => setCategoryId(event.target.value)}
            disabled={buy.isPending || loadingCategories}
          >
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {buy.error && <p className="text-sm text-red-600">{buy.error.message}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={close}
            disabled={buy.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleBuy}
            disabled={buy.isPending || loadingCategories}
          >
            {buy.isPending ? "Buying..." : "Buy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}