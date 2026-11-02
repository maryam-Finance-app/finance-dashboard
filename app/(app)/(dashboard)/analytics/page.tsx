import CategoryBreakdown from "@/components/analytics/category-breakdown";
import IncomeExpenseChart from "@/components/analytics/income-expense-chart";
import SavingsChart from "@/components/analytics/savings-chart";

export default function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <IncomeExpenseChart />

      <div className="grid gap-4 lg:grid-cols-2">
        <SavingsChart />
        <CategoryBreakdown />
      </div>
    </div>
  );
}