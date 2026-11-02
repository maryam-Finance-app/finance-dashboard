import type { ReactNode } from "react";

export function ChartCard({
  title,
  isLoading,
  isError,
  isEmpty,
  emptyText,
  actions,
  children,
}: {
  title: string;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyText: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  let content = children;

  if (isLoading) {
    content = <Message>Loading data...</Message>;
  } else if (isError) {
    content = <Message error>Could not load the data. Please try again later.</Message>;
  } else if (isEmpty) {
    content = <Message>{emptyText}</Message>;
  }

  return (
    <section className="rounded-xl border bg-background p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {actions}
      </div>
      {content}
    </section>
  );
}

function Message({ children, error }: { children: ReactNode; error?: boolean }) {
  return (
    <p
      className={
        error
          ? "py-10 text-center text-sm text-red-600"
          : "py-10 text-center text-sm text-muted-foreground"
      }
    >
      {children}
    </p>
  );
}