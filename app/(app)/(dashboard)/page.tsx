"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  TRANSACTIONS_PAGE_SIZE,
  useTransactions,
  type Transaction,
} from "@/hooks/useTransactions";
import DeleteTransaction from "@/components/transactions/deleteModal";
import TransactionForm from "@/components/transactions/transaction-form";
import TransactionsPagination from "@/components/transactions/transaction-pagination";
import TransactionsTable from "@/components/transactions/transaction-table";
import { Dialog } from "@/components/ui/dialog";

function TransactionsList() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The current page lives in the URL (?page=2), so a refresh or the
  // browser's back/forward buttons keep you on the right page. 1-based.
  const requested = Number.parseInt(searchParams.get("page") ?? "", 10);
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const { data, isLoading, isError, isPlaceholderData } = useTransactions({
    page: page - 1, // the hook is 0-based
    pageSize: TRANSACTIONS_PAGE_SIZE,
  });

  const transactions = data?.transactions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / TRANSACTIONS_PAGE_SIZE));

  // Updates ?page= without a server round trip (Next.js keeps
  // useSearchParams in sync with the native history methods)
  const goToPage = useCallback(
    (next: number, replace = false) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next <= 1) params.delete("page");
      else params.set("page", String(next));

      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;

      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    [pathname, searchParams]
  );

  // A page past the end (typed into the URL, or the only row on the last
  // page was removed) sends you to the last page instead
  useEffect(() => {
    if (data && !isPlaceholderData && page > totalPages) {
      goToPage(totalPages, true);
    }
  }, [data, isPlaceholderData, page, totalPages, goToPage]);

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

      <TransactionsPagination
        page={Math.min(page, totalPages)}
        totalPages={totalPages}
        total={total}
        pageSize={TRANSACTIONS_PAGE_SIZE}
        disabled={isPlaceholderData}
        onPageChange={(next) => goToPage(next)}
      />

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

// useSearchParams() must be inside Suspense, or `next build` fails.
export default function Home() {
  return (
    <Suspense fallback={null}>
      <TransactionsList />
    </Suspense>
  );
}