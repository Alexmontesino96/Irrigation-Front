"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { type Column } from "@/components/shared/data-table";
import { ResponsiveList } from "@/components/shared/responsive-list";
import { Pagination } from "@/components/shared/pagination";
import { useListParams } from "@/lib/use-list-params";
import { api } from "@/lib/api";
import type { Job, PaginatedResponse } from "@/lib/types";
import {
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
} from "@/lib/types";
import { Plus, Search, ChevronRight } from "lucide-react";

const columns: Column<Job>[] = [
  { key: "title", header: "Titulo", sortKey: "title" },
  {
    key: "client_name",
    header: "Cliente",
    className: "hidden sm:table-cell",
    render: (j) => j.client_name || "—",
  },
  {
    key: "job_type",
    header: "Tipo",
    sortKey: "job_type",
    className: "hidden lg:table-cell",
    render: (j) => JOB_TYPE_LABELS[j.job_type] ?? j.job_type,
  },
  {
    key: "status",
    header: "Estado",
    sortKey: "status",
    render: (j) => (
      <StatusIndicator
        status={j.status}
        label={JOB_STATUS_LABELS[j.status] ?? j.status}
      />
    ),
  },
  { key: "scheduled_date", header: "Fecha", sortKey: "scheduled_date", className: "hidden md:table-cell" },
  {
    key: "price",
    header: "Precio",
    sortKey: "price",
    className: "hidden lg:table-cell",
    render: (j) => (j.price != null ? `$${j.price.toFixed(2)}` : "—"),
  },
];

function JobsListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton h-14 w-full" />
      ))}
    </div>
  );
}

function JobsContent() {
  const router = useRouter();
  const {
    page,
    search,
    sortBy,
    sortOrder,
    filters,
    setPage,
    setSearch,
    setSort,
    setFilter,
    buildApiParams,
  } = useListParams({
    defaultSortBy: "scheduled_date",
    defaultSortOrder: "desc",
    defaultPageSize: 15,
    filterKeys: ["status", "job_type", "overdue"],
  });

  const [data, setData] = useState<PaginatedResponse<Job> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Job>>(
        `/api/jobs?${buildApiParams()}`
      );
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [buildApiParams]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const selectClass =
    "flex h-8 rounded-lg border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Trabajos</h1>
        <Link href="/dashboard/jobs/new" className={buttonVariants({ size: "sm", className: "h-10 px-4 md:h-8 md:px-2.5" })}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nuevo
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
          }}
          className="flex-1 min-w-[200px] max-w-sm"
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por titulo..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>
        <select
          value={filters.status || ""}
          onChange={(e) => setFilter("status", e.target.value || null)}
          className={selectClass}
        >
          <option value="">Todos los estados</option>
          {Object.entries(JOB_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={filters.job_type || ""}
          onChange={(e) => setFilter("job_type", e.target.value || null)}
          className={selectClass}
        >
          <option value="">Todos los tipos</option>
          {Object.entries(JOB_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <label className={`inline-flex items-center gap-1.5 text-sm ${selectClass} cursor-pointer`}>
          <input
            type="checkbox"
            checked={filters.overdue === "true"}
            onChange={(e) => setFilter("overdue", e.target.checked ? "true" : null)}
            className="rounded border-input"
          />
          Vencidos
        </label>
      </div>

      {loading && !data ? (
        <JobsListSkeleton />
      ) : data ? (
        <>
          <ResponsiveList
            columns={columns}
            data={data.items}
            onItemClick={(j) => router.push(`/dashboard/jobs/${j.id}`)}
            emptyMessage="No se encontraron trabajos"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={setSort}
            renderCard={(j) => (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <StatusIndicator
                      status={j.status}
                      label={JOB_STATUS_LABELS[j.status] ?? j.status}
                    />
                  </div>
                  <p className="text-sm font-medium truncate">{j.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {j.client_name && `${j.client_name} · `}
                    {j.scheduled_date}
                    {j.price != null && ` · $${j.price.toFixed(2)}`}
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

export default function JobsPage() {
  return (
    <Suspense fallback={<JobsListSkeleton />}>
      <JobsContent />
    </Suspense>
  );
}
