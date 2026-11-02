import type { AnalyticsRow } from "@/hooks/useAnalytics";

const round = (value: number) => Math.round(value * 100) / 100;

/** "2026-11-05" -> "2026-11" */
const monthKey = (date: string) => date.slice(0, 7);

/** "2026-11" -> "Nov 2026" */
export function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/** Every month from the first to the last one, so empty months show as 0. */
function monthRange(keys: string[]) {
  if (keys.length === 0) return [];

  const sorted = [...keys].sort();
  const [firstYear, firstMonth] = sorted[0].split("-").map(Number);
  const [lastYear, lastMonth] = sorted[sorted.length - 1].split("-").map(Number);

  const months: string[] = [];
  let year = firstYear;
  let month = firstMonth;

  while (year < lastYear || (year === lastYear && month <= lastMonth)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

function totalsByMonth(rows: AnalyticsRow[]) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = monthKey(row.date);
    totals.set(key, (totals.get(key) ?? 0) + row.amount);
  }
  return totals;
}

export type IncomeExpensePoint = {
  month: string;
  label: string;
  income: number;
  expense: number;
};

/** Income and expenses per month (the last 12 months with data). */
export function incomeVsExpense(rows: AnalyticsRow[]): IncomeExpensePoint[] {
  const income = totalsByMonth(rows.filter((row) => row.type === "income"));
  const expense = totalsByMonth(rows.filter((row) => row.type === "expense"));

  const months = monthRange([...income.keys(), ...expense.keys()]).slice(-12);

  return months.map((month) => ({
    month,
    label: monthLabel(month),
    income: round(income.get(month) ?? 0),
    expense: round(expense.get(month) ?? 0),
  }));
}

export type SavingsPoint = { month: string; label: string; amount: number };

/** Amount saved per month. */
export function savingsByMonth(rows: AnalyticsRow[]): SavingsPoint[] {
  const savings = totalsByMonth(rows.filter((row) => row.type === "savings"));

  return monthRange([...savings.keys()]).map((month) => ({
    month,
    label: monthLabel(month),
    amount: round(savings.get(month) ?? 0),
  }));
}

export type CategoryTotal = { name: string; amount: number };

/** Total per category for one type, biggest first. */
export function categoryTotals(
  rows: AnalyticsRow[],
  type: "income" | "expense"
): CategoryTotal[] {
  const totals = new Map<string, number>();

  for (const row of rows) {
    if (row.type !== type) continue;
    const name = row.category?.name ?? "Other";
    totals.set(name, (totals.get(name) ?? 0) + row.amount);
  }

  return [...totals.entries()]
    .map(([name, amount]) => ({ name, amount: round(amount) }))
    .sort((a, b) => b.amount - a.amount);
}