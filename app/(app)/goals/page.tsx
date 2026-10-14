"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { useGoalProgress, type GoalProgress } from "@/hooks/useGoals";

function GoalCard({ goal }: { goal: GoalProgress }) {
  const percent = Math.min(100, Math.max(0, goal.progress_percent));
  const purchased = !!goal.purchased_at;

  const status = purchased
    ? "Purchased"
    : goal.is_completed
      ? "Goal reached"
      : `${Math.round(goal.progress_percent)}%`;

  return (
    <div className="space-y-4 rounded-xl border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-slate-900">{goal.title}</h2>

        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            purchased
              ? "bg-slate-100 text-slate-600"
              : goal.is_completed
                ? "bg-emerald-50 text-emerald-700"
                : "bg-blue-50 text-blue-700"
          )}
        >
          {status}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-label={`${goal.title} progress`}
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            purchased
              ? "bg-slate-400"
              : goal.is_completed
                ? "bg-emerald-500"
                : "bg-slate-900"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-slate-900">
          {formatCurrency(goal.saved_amount)}
        </span>{" "}
        saved of {formatCurrency(goal.target_amount)}
      </p>
    </div>
  );
}

export default function GoalPage() {
  const { data: goals, isLoading, isError } = useGoalProgress();
  const isEmpty = !!goals && goals.length === 0;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Goals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Save money to reach the things you want.
        </p>
      </div>

      {isError && (
        <div className="flex items-center justify-center py-10 text-sm text-red-600">
          Something went wrong. Please try again later!
        </div>
      )}
      {isLoading && (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          Loading data...
        </div>
      )}
      {isEmpty && (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          You have no goals yet.
        </div>
      )}

      {goals && !isEmpty && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </>
  );
}