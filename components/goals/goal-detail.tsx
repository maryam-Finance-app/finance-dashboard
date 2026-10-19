"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { useGoalProgress } from "@/hooks/useGoals";
import {
  useTransactionByGoalId,
  type Transaction,
} from "@/hooks/useTransactions";
import DeleteTransaction from "@/components/transactions/deleteModal";
import TransactionForm from "@/components/transactions/transaction-form";
import TransactionsTable from "@/components/transactions/transaction-table";
import { Dialog } from "@/components/ui/dialog";

function BackLink() {
  return (
    <Link
      href="/goals"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeftIcon className="h-4 w-4" />
      Back to goals
    </Link>
  );
}

export default function GoalDetail({ goalId }: { goalId: string }) {
  const goals = useGoalProgress();
  const transactions = useTransactionByGoalId({ goal_id: goalId });

  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  if (goals.isLoading) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Loading goal...
      </p>
    );
  }

  if (goals.isError) {
    return (
      <p className="py-10 text-center text-sm text-red-600">
        Something went wrong. Please try again later!
      </p>
    );
  }

  const goal = goals.data?.find((item) => item.id === goalId);

  // Unknown id, or a purchased goal (its savings were replaced by one expense)
  if (!goal || goal.purchased_at) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {goal
            ? "This goal has been purchased, so it has no savings to show."
            : "We couldn't find this goal."}
        </p>
        <BackLink />
      </div>
    );
  }

  const percent = Math.min(100, Math.max(0, goal.progress_percent));
  const left = Math.max(0, goal.target_amount - goal.saved_amount);

  return (
    <div className="space-y-6">
      <BackLink />

      <div>
        <h1 className="text-2xl font-semibold">{goal.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {goal.is_completed
            ? "Goal reached. You can buy it from the goals page."
            : `${formatCurrency(left)} left to reach this goal.`}
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-xl border bg-background p-5">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
          aria-label={`${goal.title} progress`}
          className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className={
              goal.is_completed
                ? "h-full rounded-full bg-emerald-500 transition-all"
                : "h-full rounded-full bg-slate-900 transition-all"
            }
            style={{ width: `${percent}%` }}
          />
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Saved</dt>
            <dd className="font-medium">{formatCurrency(goal.saved_amount)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Target</dt>
            <dd className="font-medium">{formatCurrency(goal.target_amount)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Left</dt>
            <dd className="font-medium">{formatCurrency(left)}</dd>
          </div>
        </dl>
      </div>

      {/* Savings toward this goal */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Savings</h2>

        {transactions.isLoading && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Loading transactions...
          </p>
        )}

        {transactions.isError && (
          <p className="py-6 text-center text-sm text-red-600">
            Could not load the transactions. Please try again later.
          </p>
        )}

        {transactions.data && (
          <div className="rounded-xl border bg-background">
            <TransactionsTable
              transactions={transactions.data}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          </div>
        )}
      </section>

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

      <DeleteTransaction
        transaction={deleting}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}