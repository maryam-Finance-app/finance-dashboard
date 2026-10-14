"use client";

import { useDeleteTransaction } from "@/hooks/useTransactions";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

type DeleteTransactionProps = {
  transactionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function DeleteTransaction({
  transactionId,
  open,
  onOpenChange,
}: DeleteTransactionProps) {
  const deleteTransaction = useDeleteTransaction();

  const handleDelete = () => {
    deleteTransaction.mutate(transactionId, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Transaction</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this transaction?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {deleteTransaction.isError && (
          <p className="text-sm text-red-600">
            {deleteTransaction.error.message}
          </p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteTransaction.isPending}
          >
            No
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteTransaction.isPending}
          >
            {deleteTransaction.isPending ? "Deleting..." : "Yes, delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
