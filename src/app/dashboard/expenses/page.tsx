"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { type Column } from "@/components/shared/data-table";
import { ResponsiveList } from "@/components/shared/responsive-list";
import { Pagination } from "@/components/shared/pagination";
import { useListParams } from "@/lib/use-list-params";
import { api } from "@/lib/api";
import type { Expense, PaginatedResponse } from "@/lib/types";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/types";
import { Plus, ChevronRight } from "lucide-react";

const columns: Column<Expense>[] = [
  { key: "expense_date", header: "Fecha", sortKey: "expense_date" },
  { key: "description", header: "Descripcion" },
  {
    key: "category",
    header: "Categoria",
    sortKey: "category",
    render: (e) => (
      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
        {EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}
      </span>
    ),
  },
  {
    key: "amount",
    header: "Monto",
    sortKey: "amount",
    className: "text-right",
    render: (e) => `$${e.amount.toFixed(2)}`,
  },
];

function ExpensesSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton h-14 w-full" />
      ))}
    </div>
  );
}

function ExpensesContent() {
  const router = useRouter();
  const {
    page,
    sortBy,
    sortOrder,
    filters,
    setPage,
    setSort,
    setFilter,
    buildApiParams,
  } = useListParams({
    defaultSortBy: "expense_date",
    defaultSortOrder: "desc",
    defaultPageSize: 15,
    filterKeys: ["category", "date_from", "date_to"],
  });

  const [data, setData] = useState<PaginatedResponse<Expense> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Expense>>(
        `/api/expenses?${buildApiParams()}`
      );
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [buildApiParams]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const selectClass =
    "flex h-8 rounded-lg border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Gastos</h1>
        <Link
          href="/dashboard/expenses/new"
          className={buttonVariants({ size: "sm", className: "h-10 px-4 md:h-8 md:px-2.5" })}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nuevo
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filters.category || ""}
          onChange={(e) => setFilter("category", e.target.value || null)}
          className={selectClass}
        >
          <option value="">Todas las categorias</option>
          {Object.entries(EXPENSE_CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.date_from || ""}
          onChange={(e) => setFilter("date_from", e.target.value || null)}
          className={selectClass}
          placeholder="Desde"
        />
        <input
          type="date"
          value={filters.date_to || ""}
          onChange={(e) => setFilter("date_to", e.target.value || null)}
          className={selectClass}
          placeholder="Hasta"
        />
      </div>

      {loading && !data ? (
        <ExpensesSkeleton />
      ) : data ? (
        <>
          <ResponsiveList
            columns={columns}
            data={data.items}
            onItemClick={(e) => router.push(`/dashboard/expenses/${e.id}/edit`)}
            emptyMessage="No se encontraron gastos"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={setSort}
            renderCard={(e) => (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
                      {EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{e.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {e.expense_date} · ${e.amount.toFixed(2)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </div>
            )}
          />
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<ExpensesSkeleton />}>
      <ExpensesContent />
    </Suspense>
  );
}
