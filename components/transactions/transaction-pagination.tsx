"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "../ui/button";

type PageItem = number | "ellipsis-start" | "ellipsis-end";

// Page numbers to show: always at most 7 slots, like  1 … 4 5 6 … 12
function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-end", total];
  }
  if (current >= total - 3) {
    return [1, "ellipsis-start", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [
    1,
    "ellipsis-start",
    current - 1,
    current,
    current + 1,
    "ellipsis-end",
    total,
  ];
}

export default function TransactionsPagination({
  page,
  totalPages,
  total,
  pageSize,
  disabled = false,
  onPageChange,
}: {
  page: number; // 1-based
  totalPages: number;
  total: number;
  pageSize: number;
  disabled?: boolean; // e.g. while the next page is loading
  onPageChange: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {from}-{to} of {total}
      </p>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="First page"
            disabled={disabled || isFirst}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            aria-label="Previous page"
            disabled={disabled || isFirst}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Small screens: a short label instead of all the page numbers */}
          <span className="px-2 text-sm text-muted-foreground sm:hidden">
            Page {page} of {totalPages}
          </span>

          <div className="hidden items-center gap-1 sm:flex">
            {getPageItems(page, totalPages).map((item) =>
              typeof item === "number" ? (
                <Button
                  key={item}
                  variant={item === page ? "default" : "outline"}
                  size="icon"
                  className="w-auto min-w-9 px-2"
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  disabled={disabled}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              ) : (
                <span
                  key={item}
                  aria-hidden="true"
                  className="px-1 text-muted-foreground"
                >
                  …
                </span>
              )
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            aria-label="Next page"
            disabled={disabled || isLast}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            aria-label="Last page"
            disabled={disabled || isLast}
            onClick={() => onPageChange(totalPages)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}