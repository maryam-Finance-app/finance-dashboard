"use client";

import { formatCurrency, formatDate } from "@/lib/format";
import {
  useDeleteTransaction,
  type Transaction,
} from "@/hooks/useTransactions";
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
 * Confirmation dialog for removing a transaction.
 * It is open whenever `transaction` is set; clearing it (onClose) closes it.
 */
export default function DeleteTransaction({
  transaction,
  onClose,
}: {
  transaction: Transaction | null;
  onClose: () => void;
}) {
  const remove = useDeleteTransaction();

  function close() {
    remove.reset(); // clear any previous error
    onClose();
  }

  function handleRemove() {
    if (!transaction) return;
    remove.mutate(transaction.id, { onSuccess: close });
  }

  return (
    <Dialog
      open={!!transaction}
      onOpenChange={(open) => {
        // Don't let the dialog close while the request is running
        if (!open && !remove.isPending) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Transaction</DialogTitle>
          <DialogDescription>
            {transaction
              ? `Are you sure you want to remove this ${transaction.type} of ${formatCurrency(transaction.amount)} from ${formatDate(transaction.date)}? This can't be undone.`
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