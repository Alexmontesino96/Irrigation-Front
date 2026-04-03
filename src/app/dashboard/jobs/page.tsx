"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { type Column } from "@/components/shared/data-table";
import { ResponsiveList } from "@/components/shared/responsive-list";
import { Pagination } from "@/components/shared/pagination";
import { api } from "@/lib/api";
import type { Job, PaginatedResponse } from "@/lib/types";
import {
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
} from "@/lib/types";
import { Plus, Search, ChevronRight } from "lucide-react";

const PAGE_SIZE = 15;

const columns: Column<Job>[] = [
  { key: "title", header: "Titulo" },
  {
    key: "client_name",
    header: "Cliente",
    className: "hidden sm:table-cell",
    render: (j) => j.client_name || "—",
  },
  {
    key: "job_type",
    header: "Tipo",
    className: "hidden lg:table-cell",
    render: (j) => JOB_TYPE_LABELS[j.job_type] ?? j.job_type,
  },
  {
    key: "status",
    header: "Estado",
    render: (j) => (
      <StatusIndicator
        status={j.status}
        label={JOB_STATUS_LABELS[j.status] ?? j.status}
      />
    ),
  },
  { key: "scheduled_date", header: "Fecha", className: "hidden md:table-cell" },
  {
    key: "price",
    header: "Precio",
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

export default function JobsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Job> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("job_type", typeFilter);
      const res = await api.get<PaginatedResponse<Job>>(
        `/api/jobs?${params}`
      );
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  function handleFilterChange(
    setter: (v: string) => void,
    value: string
  ) {
    setter(value);
    setPage(1);
  }

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
            setPage(1);
          }}
          className="flex-1 min-w-[200px] max-w-sm"
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por titulo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>
        <select
          value={statusFilter}
          onChange={(e) =>
            handleFilterChange(setStatusFilter, e.target.value)
          }
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
          value={typeFilter}
          onChange={(e) =>
            handleFilterChange(setTypeFilter, e.target.value)
          }
          className={selectClass}
        >
          <option value="">Todos los tipos</option>
          {Object.entries(JOB_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
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
