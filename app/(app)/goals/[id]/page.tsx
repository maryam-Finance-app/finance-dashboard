import GoalDetail from "@/components/goals/goal-detail";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GoalDetail goalId={id} />;
}