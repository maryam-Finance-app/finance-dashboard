"use client";

import { useGoalProgress } from "@/hooks/useGoals";
import { GoalCard } from '@/components/goals/goal-card'


export default function GoalPage() {
  const { data: goals, isLoading, isError } = useGoalProgress();
  const isEmpty = !!goals && goals.length === 0;

  return (
    <>
      <div className="flex justify-between w-full">
        <div>
            <h1 className="text-2xl font-semibold">Goals</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Save money to reach the things you want.
            </p>
        </div>

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