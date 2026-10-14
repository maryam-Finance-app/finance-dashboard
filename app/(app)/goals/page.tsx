"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { useGoalProgress, type GoalProgress } from "@/hooks/useGoals";
import { GoalCard } from "@/components/goals/goal-card";
import GoalForm from "@/components/goals/goal-form";
import DeleteGoal from "@/components/goals/delete-goal";
import BuyGoal from "@/components/goals/buy-goal";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function GoalPage() {
  const { data: goals, isLoading, isError } = useGoalProgress();
  const isEmpty = !!goals && goals.length === 0;

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<GoalProgress | null>(null);
  const [deleting, setDeleting] = useState<GoalProgress | null>(null);
  const [buying, setBuying] = useState<GoalProgress | null>(null);

  return (
    <>
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Goals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save money to reach the things you want.
          </p>
        </div>

        {/* New goal. The form is only mounted while open, so it always starts empty. */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button className="flex cursor-pointer rounded-2xl">
                <Plus />
                New Goal
              </Button>
            }
          />
          {createOpen && (
            <GoalForm
              title="New Goal"
              onSuccess={() => setCreateOpen(false)}
            />
          )}
        </Dialog>
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
          You have no goals yet. Create your first one to start saving.
        </div>
      )}

      {goals && !isEmpty && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={setEditing}
              onDelete={setDeleting}
              onBuy={setBuying}
            />
          ))}
        </div>
      )}

      {/* Edit: the same form as "New Goal", filled with the goal's data */}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        {editing && (
          <GoalForm
            key={editing.id}
            title="Edit Goal"
            goal={editing}
            onSuccess={() => setEditing(null)}
          />
        )}
      </Dialog>

      <DeleteGoal goal={deleting} onClose={() => setDeleting(null)} />
      <BuyGoal goal={buying} onClose={() => setBuying(null)} />
    </>
  );
}