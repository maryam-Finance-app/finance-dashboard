"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/format";
import { incomeVsExpense } from "@/lib/validators/analytics";
import { useAnalyticsData } from "@/hooks/useAnalytics";
import { ChartCard } from "./chart-card";

export default function IncomeExpenseChart() {
  const { data, isLoading, isError } = useAnalyticsData();
  const points = incomeVsExpense(data ?? []);

  return (
    <ChartCard
      title="Income vs. expenses"
      isLoading={isLoading}
      isError={isError}
      isEmpty={points.length === 0}
      emptyText="Add some income or expenses to see this chart."
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={60}
              tickFormatter={(value) => formatCurrency(Number(value))}
            />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}