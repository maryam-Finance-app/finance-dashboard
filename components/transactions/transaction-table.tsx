"use client";

import { useState } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  Transaction,
  TransactionType,
} from "@/hooks/useTransactions";

import DeleteTransaction from "./deleteModal";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// "2026-10-13" -> "Oct 13, 2026"
function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
}: {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
}) {
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category / Goal</TableHead>
            <TableHead className="hidden md:table-cell">
              Note
            </TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-20">
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

                <TableCell>
                  {transaction.category?.name ??
                    transaction.goal?.title ??
                    "-"}
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
                  {currency.format(transaction.amount)}
                </TableCell>

                <TableCell className="whitespace-nowrap text-right">
                  {/* Edit transaction */}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit transaction"
                    onClick={() => onEdit(transaction)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>

                  {/* Open delete confirmation dialog */}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete transaction"
                    onClick={() =>
                      setTransactionToDelete(transaction)
                    }
                  >
                    <Trash2Icon className="h-4 w-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Delete confirmation dialog for the selected transaction */}
      {transactionToDelete && (
        <DeleteTransaction
          transactionId={transactionToDelete.id}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setTransactionToDelete(null);
            }
          }}
        />
      )}
    </>
  );
}