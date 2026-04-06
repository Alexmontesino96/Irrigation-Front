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
import type { Invoice, PaginatedResponse } from "@/lib/types";
import { INVOICE_STATUS_LABELS } from "@/lib/types";
import { Plus, ChevronRight } from "lucide-react";

const columns: Column<Invoice>[] = [
  { key: "invoice_number", header: "Numero", sortKey: "invoice_number" },
  {
    key: "client_name",
    header: "Cliente",
    className: "hidden sm:table-cell",
    render: (i) => i.client_name || "—",
  },
  { key: "issue_date", header: "Fecha", sortKey: "issue_date", className: "hidden md:table-cell" },
  {
    key: "due_date",
    header: "Vencimiento",
    sortKey: "due_date",
    className: "hidden lg:table-cell",
  },
  {
    key: "total",
    header: "Total",
    sortKey: "total",
    className: "text-right",
    render: (i) => `$${i.total.toFixed(2)}`,
  },
  {
    key: "status",
    header: "Estado",
    sortKey: "status",
    render: (i) => (
      <StatusIndicator
        status={i.status}
        label={INVOICE_STATUS_LABELS[i.status] ?? i.status}
      />
    ),
  },
];

function InvoicesSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton h-14 w-full" />
      ))}
    </div>
  );
}

function InvoicesContent() {
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
    defaultSortBy: "issue_date",
    defaultSortOrder: "desc",
    defaultPageSize: 15,
    filterKeys: ["status", "client_id"],
  });

  const [data, setData] = useState<PaginatedResponse<Invoice> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Invoice>>(
        `/api/invoices?${buildApiParams()}`
      );
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [buildApiParams]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const selectClass =
    "flex h-8 rounded-lg border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Facturas</h1>
        <Link
          href="/dashboard/invoices/new"
          className={buttonVariants({ size: "sm", className: "h-10 px-4 md:h-8 md:px-2.5" })}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nueva
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filters.status || ""}
          onChange={(e) => setFilter("status", e.target.value || null)}
          className={selectClass}
        >
          <option value="">Todos los estados</option>
          {Object.entries(INVOICE_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {loading && !data ? (
        <InvoicesSkeleton />
      ) : data ? (
        <>
          <ResponsiveList
            columns={columns}
            data={data.items}
            onItemClick={(i) => router.push(`/dashboard/invoices/${i.id}`)}
            emptyMessage="No se encontraron facturas"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={setSort}
            renderCard={(i) => (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <StatusIndicator
                      status={i.status}
                      label={INVOICE_STATUS_LABELS[i.status] ?? i.status}
                    />
                  </div>
                  <p className="text-sm font-medium truncate">
                    {i.invoice_number} — {i.client_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {i.issue_date} · ${i.total.toFixed(2)}
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

export default function InvoicesPage() {
  return (
    <Suspense fallback={<InvoicesSkeleton />}>
      <InvoicesContent />
    </Suspense>
  );
}
