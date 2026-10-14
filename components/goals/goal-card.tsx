"use client";

import { PencilIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { GoalProgress } from "@/hooks/useGoals";
import { Button } from "../ui/button";

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  onBuy,
}: {
  goal: GoalProgress;
  onEdit: (goal: GoalProgress) => void;
  onDelete: (goal: GoalProgress) => void;
  onBuy: (goal: GoalProgress) => void;
}) {
  const percent = Math.min(100, Math.max(0, goal.progress_percent));
  const purchased = !!goal.purchased_at;
  const canBuy = goal.is_completed && !purchased;

  const status = purchased
    ? "Purchased"
    : goal.is_completed
      ? "Goal reached"
      : `${Math.round(goal.progress_percent)}%`;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-background p-5">
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

      <div className="mt-auto flex items-center justify-between gap-2">
        <div>
          {canBuy && (
            <Button size="sm" onClick={() => onBuy(goal)}>
              <ShoppingBagIcon className="mr-2 h-4 w-4" />
              Buy
            </Button>
          )}
        </div>

        <div className="flex items-center">
          {/* A bought goal is final: its expense was created from the target */}
          {!purchased && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit goal"
              onClick={() => onEdit(goal)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove goal"
            className="text-muted-foreground hover:text-red-600"
            onClick={() => onDelete(goal)}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}