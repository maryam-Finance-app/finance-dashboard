"use client";

import { PencilIcon, Trash2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Transaction, TransactionType } from "@/hooks/useTransactions";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const typeStyles: Record<
  TransactionType,
  { label: string; badge: string; amount: string; sign: string }
> = {
  income: {
    label: "Income",
    badge: "bg-emerald-50 text-emerald-700",
    amount: "text-emerald-600",
    sign: "+",
  },
  expense: {
    label: "Expense",
    badge: "bg-red-50 text-red-700",
    amount: "text-red-600",
    sign: "-",
  },
  savings: {
    label: "Savings",
    badge: "bg-blue-50 text-blue-700",
    amount: "text-blue-600",
    sign: "",
  },
};

export default function TransactionsTable({
  transactions,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category / Goal</TableHead>
          <TableHead className="hidden md:table-cell">Note</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-24">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {transactions.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-24 text-center text-muted-foreground"
            >
              No transactions found.
            </TableCell>
          </TableRow>
        )}

        {transactions.map((transaction) => {
          const style = typeStyles[transaction.type];

          return (
            <TableRow key={transaction.id}>
              <TableCell className="whitespace-nowrap">
                {formatDate(transaction.date)}
              </TableCell>

              <TableCell>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    style.badge
                  )}
                >
                  {style.label}
                </span>
              </TableCell>

              {/* Savings have a goal instead of a category */}
              <TableCell>
                {transaction.category?.name ?? transaction.goal?.title ?? "-"}
              </TableCell>

              <TableCell className="hidden max-w-60 truncate text-muted-foreground md:table-cell">
                {transaction.note ?? "-"}
              </TableCell>

              <TableCell
                className={cn(
                  "whitespace-nowrap text-right font-medium tabular-nums",
                  style.amount
                )}
              >
                {style.sign}
                {formatCurrency(transaction.amount)}
              </TableCell>

              <TableCell className="whitespace-nowrap text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Edit transaction"
                  onClick={() => onEdit(transaction)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove transaction"
                  className="text-muted-foreground hover:text-red-600"
                  onClick={() => onDelete(transaction)}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}