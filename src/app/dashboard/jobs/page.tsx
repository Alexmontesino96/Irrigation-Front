"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ResponsiveList } from "@/components/shared/responsive-list";
import { Pagination } from "@/components/shared/pagination";
import { api } from "@/lib/api";
import type { Job, PaginatedResponse } from "@/lib/types";
import {
  JOB_STATUS,
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  type JobStatus,
  type JobType,
} from "@/lib/types";
import { Plus, Search, CalendarDays, DollarSign, User, ChevronRight } from "lucide-react";

const PAGE_SIZE = 15;

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  cancelled: "destructive",
};

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
      <Badge variant={STATUS_COLORS[j.status] ?? "secondary"}>
        {JOB_STATUS_LABELS[j.status] ?? j.status}
      </Badge>
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
    "flex h-10 rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:h-8 md:text-sm";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Trabajos</h1>
        <Link href="/dashboard/jobs/new" className={buttonVariants({ className: "h-10 px-4 md:h-8 md:px-2.5" })}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo trabajo
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
        <p className="text-muted-foreground">Cargando...</p>
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
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-semibold truncate">{j.title}</p>
                    <Badge variant={STATUS_COLORS[j.status] ?? "secondary"} className="shrink-0 text-xs">
                      {JOB_STATUS_LABELS[j.status] ?? j.status}
                    </Badge>
                  </div>
                  {j.client_name && (
                    <p className="flex items-center gap-1.5 text-sm text-foreground/80 mb-1.5">
                      <User className="h-3.5 w-3.5" />
                      {j.client_name}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{JOB_TYPE_LABELS[j.job_type] ?? j.job_type}</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {j.scheduled_date}
                    </span>
                    {j.price != null && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        ${j.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0" />
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
