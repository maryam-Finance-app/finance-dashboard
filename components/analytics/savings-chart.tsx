"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/format";
import { savingsByMonth } from "@/lib/validators/analytics";
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

export default function SavingsChart() {
  const { data, isLoading, isError } = useAnalyticsData();
  const points = savingsByMonth(data ?? []);

  return (
    <ChartCard
      title="Savings over time"
      isLoading={isLoading}
      isError={isError}
      isEmpty={points.length === 0}
      emptyText="Add a savings transaction to see this chart."
    >
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
            <Line
              type="monotone"
              dataKey="amount"
              name="Saved"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...points].reverse().map((point) => (
              <TableRow key={point.month}>
                <TableCell>{point.label}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(point.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ChartCard>
  );
}