"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { categoryTotals } from "@/lib/validators/analytics";
import { useAnalyticsData } from "@/hooks/useAnalytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ChartCard } from "./chart-card";

type Kind = "income" | "expense";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#64748b",
];

// Same look as <Input>, for a native <select>
const selectClass = cn(
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
);

export default function CategoryBreakdown() {
  const { data, isLoading, isError } = useAnalyticsData();
  const [kind, setKind] = useState<Kind>("expense");

  const totals = categoryTotals(data ?? [], kind);
  const colorFor = (index: number) => COLORS[index % COLORS.length];

  return (
    <ChartCard
      title="By category"
      isLoading={isLoading}
      isError={isError}
      isEmpty={totals.length === 0}
      emptyText={`You have no ${kind === "income" ? "income" : "expenses"} yet.`}
      actions={
        <select
          aria-label="Transaction type"
          className={selectClass}
          value={kind}
          onChange={(event) => setKind(event.target.value as Kind)}
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      }
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={totals}
              dataKey="amount"
              nameKey="name"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
            >
              {totals.map((item, index) => (
                <Cell key={item.name} fill={colorFor(index)} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {totals.map((item, index) => (
              <TableRow key={item.name}>
                <TableCell>
                  <span
                    aria-hidden
                    className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: colorFor(index) }}
                  />
                  {item.name}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(item.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ChartCard>
  );
}