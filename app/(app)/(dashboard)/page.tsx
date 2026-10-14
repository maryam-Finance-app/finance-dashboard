"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTransactions, type Transaction } from "@/hooks/useTransactions";
import DeleteTransaction from "@/components/transactions/deleteModal";
import TransactionForm from "@/components/transactions/transaction-form";
import TransactionsTable from "@/components/transactions/transaction-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const PAGE_SIZE = 20;

export default function Home() {
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const { data, isLoading, isError, isPlaceholderData } = useTransactions({
    page,
    pageSize: PAGE_SIZE,
  });

  const transactions = data?.transactions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  // If the current page ends up past the last one (for example after
  // removing the only row on it), go back to the last page
  useEffect(() => {
    if (data && page > 0 && data.transactions.length === 0) {
      setPage(totalPages - 1);
    }
  }, [data, page, totalPages]);

  if (isLoading) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Loading transactions...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-red-600">
        Could not load your transactions. Please try again later.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      {/* Dimmed while the next page is loading */}
      <div
        className={cn(
          "rounded-xl border bg-background transition-opacity",
          isPlaceholderData && "opacity-60"
        )}
      >
        <TransactionsTable
          transactions={transactions}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {from}-{to} of {total}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => current - 1)}
            disabled={page === 0 || isPlaceholderData}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => current + 1)}
            disabled={page >= totalPages - 1 || isPlaceholderData}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit dialog: the same form as "Add", filled with the row's data */}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        {editing && (
          <TransactionForm
            key={editing.id}
            title="Edit Transaction"
            transaction={editing}
            onSuccess={() => setEditing(null)}
          />
        )}
      </Dialog>

      {/* Remove confirmation */}
      <DeleteTransaction
        transaction={deleting}
        onClose={() => setDeleting(null)}
      />
    </section>
  );
}