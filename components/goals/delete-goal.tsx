"use client";

import { formatCurrency } from "@/lib/format";
import { useDeleteGoal, type GoalProgress } from "@/hooks/useGoals";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

/**
 * Confirmation dialog for removing a goal.
 * It is open whenever `goal` is set; clearing it (onClose) closes it.
 */
export default function DeleteGoal({
  goal,
  onClose,
}: {
  goal: GoalProgress | null;
  onClose: () => void;
}) {
  const remove = useDeleteGoal();

  function close() {
    remove.reset(); // clear any previous error
    onClose();
  }

  function handleRemove() {
    if (!goal) return;
    remove.mutate(goal.id, { onSuccess: close });
  }

  return (
    <Dialog
      open={!!goal}
      onOpenChange={(open) => {
        // Don't let the dialog close while the request is running
        if (!open && !remove.isPending) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Goal</DialogTitle>
          <DialogDescription>
            {goal
              ? `Are you sure you want to remove "${goal.title}"?${
                  goal.saved_amount > 0 && !goal.purchased_at
                    ? ` The ${formatCurrency(goal.saved_amount)} saved toward it will also be removed from your transactions.`
                    : ""
                } This can't be undone.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {remove.error && (
          <p className="text-sm text-red-600">{remove.error.message}</p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={close}
            disabled={remove.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleRemove}
            disabled={remove.isPending}
          >
            {remove.isPending ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}