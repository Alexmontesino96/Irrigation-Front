"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Upload, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/pagination";
import { useListParams } from "@/lib/use-list-params";
import { api } from "@/lib/api";
import type { Invoice, PaginatedResponse } from "@/lib/types";
import { INVOICE_STATUS_LABELS } from "@/lib/types";

// ── Avatar helpers ──────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-emerald-600",
  "bg-blue-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-teal-600",
  "bg-pink-600",
  "bg-orange-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

// ── Status badge styles ─────────────────────────────────────────────────────

const STATUS_BADGE_STYLES: Record<string, string> = {
  overdue: "bg-red-100 text-red-700",
  sent: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
  cancelled: "bg-gray-100 text-gray-400",
};

// ── Due date label ──────────────────────────────────────────────────────────

function dueDateLabel(dateStr: string): string {
  // Parse YYYY-MM-DD as local date to avoid UTC offset issues
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const due = new Date(year, month, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (due.getTime() === today.getTime()) return "Hoy";
  if (due.getTime() === tomorrow.getTime()) return "Manana";

  return due.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function InvoicesListSkeleton() {
  return (
    <div className="space-y-4">
      {/* header skeleton */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-8 w-28 rounded-md" />
        <div className="flex gap-2">
          <div className="skeleton h-8 w-32 rounded-lg" />
          <div className="skeleton h-8 w-24 rounded-lg" />
        </div>
      </div>
      {/* search skeleton */}
      <div className="skeleton h-10 w-full rounded-lg" />
      {/* filter row skeleton */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="skeleton h-8 w-44 rounded-lg" />
      </div>
      {/* rows skeleton */}
      <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 w-28 rounded" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
            <div className="skeleton h-9 w-9 rounded-full shrink-0 hidden sm:block" />
            <div className="skeleton h-3 w-32 rounded hidden sm:block" />
            <div className="skeleton h-5 w-16 rounded-full hidden md:block" />
            <div className="skeleton h-3 w-24 rounded hidden lg:block" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Invoice Avatar ────────────────────────────────────────────────────────────

function InvoiceAvatar({ clientName }: { clientName: string }) {
  const colorClass = getAvatarColor(clientName);
  const initials = getInitials(clientName);

  return (
    <div
      className={`h-9 w-9 ${colorClass} inline-flex items-center justify-center rounded-full font-semibold text-white text-sm shrink-0`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// ── Desktop Table ─────────────────────────────────────────────────────────────

function InvoicesTable({
  invoices,
  onRowClick,
}: {
  invoices: Invoice[];
  onRowClick: (invoice: Invoice) => void;
}) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 flex items-center justify-center h-48">
        <p className="text-sm text-muted-foreground">
          No se encontraron facturas
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30">
            <th className="h-9 px-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground w-[18%]">
              Factura
            </th>
            <th className="h-9 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground w-[25%]">
              Cliente
            </th>
            <th className="h-9 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell w-[14%]">
              Propiedad
            </th>
            <th className="h-9 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell w-[12%]">
              Estado
            </th>
            <th className="h-9 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell w-[15%]">
              Fecha
            </th>
            <th className="h-9 px-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground w-[12%]">
              Monto
            </th>
            <th className="h-9 px-3 w-8" aria-label="Accion" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {invoices.map((invoice) => {
            const clientName = invoice.client_name || "Cliente";
            const badgeStyle =
              STATUS_BADGE_STYLES[invoice.status] ?? "bg-gray-100 text-gray-600";

            return (
              <tr
                key={invoice.id}
                className="hover:bg-muted/40 cursor-pointer transition-colors"
                onClick={() => onRowClick(invoice)}
              >
                {/* Factura: due date label + invoice number */}
                <td className="px-4 py-3">
                  <p className="font-medium text-[13px]">
                    {dueDateLabel(invoice.due_date)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    # {invoice.invoice_number}
                  </p>
                </td>

                {/* Cliente */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <InvoiceAvatar clientName={clientName} />
                    <div className="min-w-0">
                      <p className="font-medium text-[13px] truncate">
                        {clientName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {clientName}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Propiedad */}
                <td className="px-3 py-3 text-[13px] text-muted-foreground hidden lg:table-cell">
                  —
                </td>

                {/* Estado */}
                <td className="px-3 py-3 hidden md:table-cell">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle}`}
                  >
                    {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                  </span>
                </td>

                {/* Fecha */}
                <td className="px-3 py-3 text-[13px] text-muted-foreground hidden lg:table-cell">
                  {formatDate(invoice.issue_date)}
                </td>

                {/* Monto */}
                <td className="px-3 py-3 text-[13px] font-medium text-right">
                  ${invoice.total.toFixed(2)}
                </td>

                {/* Ver */}
                <td className="px-3 py-3 text-right">
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 inline-block" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Mobile Cards ──────────────────────────────────────────────────────────────

function InvoicesMobileList({
  invoices,
  onItemClick,
}: {
  invoices: Invoice[];
  onItemClick: (invoice: Invoice) => void;
}) {
  if (invoices.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-10">
        No se encontraron facturas
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
      {invoices.map((invoice) => {
        const clientName = invoice.client_name || "Cliente";
        const badgeStyle =
          STATUS_BADGE_STYLES[invoice.status] ?? "bg-gray-100 text-gray-600";

        return (
          <div
            key={invoice.id}
            className="px-3.5 py-3 transition-colors active:bg-muted/50 cursor-pointer"
            onClick={() => onItemClick(invoice)}
          >
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <p className="text-sm font-medium">
                # {invoice.invoice_number}
              </p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${badgeStyle}`}
              >
                {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
              </span>
            </div>
            <p className="text-sm text-foreground truncate">{clientName}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                {formatDate(invoice.issue_date)}
              </p>
              <p className="text-sm font-semibold">${invoice.total.toFixed(2)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Sort options ──────────────────────────────────────────────────────────────

type SortOption = {
  label: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

const SORT_OPTIONS: SortOption[] = [
  { label: "Fecha de vencimiento", sortBy: "due_date", sortOrder: "desc" },
  { label: "Fecha de emision", sortBy: "issue_date", sortOrder: "desc" },
  { label: "Monto", sortBy: "total", sortOrder: "desc" },
  { label: "Numero", sortBy: "invoice_number", sortOrder: "desc" },
];

// ── Status filter tabs ────────────────────────────────────────────────────────

type StatusTab = {
  label: string;
  value: string | null;
};

const STATUS_TABS: StatusTab[] = [
  { label: "Todas", value: null },
  { label: "Sin pagar", value: "sent" },
  { label: "Pagadas", value: "paid" },
  { label: "Vencidas", value: "overdue" },
];

// ── Main content ──────────────────────────────────────────────────────────────

function InvoicesContent() {
  const router = useRouter();
  const {
    page,
    search,
    sortBy,
    sortOrder,
    filters,
    setPage,
    setSearch,
    setSortDirect,
    setFilter,
    buildApiParams,
  } = useListParams({
    defaultSortBy: "due_date",
    defaultSortOrder: "desc",
    defaultPageSize: 20,
    filterKeys: ["status"],
  });

  const [data, setData] = useState<PaginatedResponse<Invoice> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  const activeStatus = filters.status ?? null;

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

  // Sync local search input with URL search param
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Debounce search: update URL 400 ms after user stops typing
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput);
      }
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput, search, setSearch]);

  // Current sort option index for the <select>
  const currentSortIndex = SORT_OPTIONS.findIndex(
    (o) => o.sortBy === sortBy && o.sortOrder === sortOrder
  );
  const selectedSortIndex = currentSortIndex === -1 ? 0 : currentSortIndex;

  const handleSortChange = (index: number) => {
    const opt = SORT_OPTIONS[index];
    if (opt) {
      setSortDirect(opt.sortBy, opt.sortOrder);
    }
  };

  const handleTabChange = (value: string | null) => {
    setFilter("status", value);
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
        <div className="flex items-center gap-2">
          <a
            href="#"
            className={buttonVariants({ variant: "outline", size: "sm" })}
            aria-label="Importar facturas"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Importar
          </a>
          <Link
            href="/dashboard/invoices/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nueva Factura
          </Link>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar facturas..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9 h-10 w-full"
          aria-label="Buscar facturas"
        />
      </div>

      {/* ── Filter row ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Status tabs */}
        <div
          className="inline-flex items-center rounded-lg border border-border overflow-hidden text-sm"
          role="group"
          aria-label="Filtrar por estado"
        >
          {STATUS_TABS.map((tab, i) => {
            const isActive = activeStatus === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => handleTabChange(tab.value)}
                className={`px-3 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  i > 0 ? "border-l border-border" : ""
                } ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                aria-pressed={isActive}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="invoices-sort"
            className="text-sm text-muted-foreground shrink-0"
          >
            Ordenar:
          </label>
          <select
            id="invoices-sort"
            value={selectedSortIndex}
            onChange={(e) => handleSortChange(Number(e.target.value))}
            className="flex h-8 rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          >
            {SORT_OPTIONS.map((opt, i) => (
              <option key={i} value={i}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table / Cards / Skeleton ── */}
      {loading && !data ? (
        <div className="space-y-2">
          <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3.5 w-28 rounded" />
                  <div className="skeleton h-3 w-16 rounded" />
                </div>
                <div className="skeleton h-9 w-9 rounded-full shrink-0 hidden sm:block" />
                <div className="skeleton h-3 w-32 rounded hidden sm:block" />
                <div className="skeleton h-5 w-16 rounded-full hidden md:block" />
                <div className="skeleton h-3 w-24 rounded hidden lg:block" />
                <div className="skeleton h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : data ? (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <InvoicesTable
              invoices={data.items}
              onRowClick={(inv) => router.push(`/dashboard/invoices/${inv.id}`)}
            />
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            <InvoicesMobileList
              invoices={data.items}
              onItemClick={(inv) =>
                router.push(`/dashboard/invoices/${inv.id}`)
              }
            />
          </div>

          {/* Pagination */}
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

// ── Page export ───────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  return (
    <Suspense fallback={<InvoicesListSkeleton />}>
      <InvoicesContent />
    </Suspense>
  );
}
