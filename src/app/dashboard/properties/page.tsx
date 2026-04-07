"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Upload } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/pagination";
import { useListParams } from "@/lib/use-list-params";
import { api } from "@/lib/api";
import type { PropertyWithClient, PaginatedResponse } from "@/lib/types";

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
  if (parts.length === 1) {
    return (parts[0]?.slice(0, 2) ?? "").toUpperCase();
  }
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

// ── Relative time ───────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 60) return `hace ${minutes} min`;
  if (hours < 24) return `hace ${hours} h`;
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} dias`;
  if (weeks === 1) return "hace 1 semana";
  if (weeks < 5) return `hace ${weeks} semanas`;
  if (months === 1) return "hace 1 mes";
  return `hace ${months} meses`;
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function PropertiesListSkeleton() {
  return (
    <div className="space-y-4">
      {/* header skeleton */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-8 w-36 rounded-md" />
        <div className="flex gap-2">
          <div className="skeleton h-8 w-36 rounded-lg" />
          <div className="skeleton h-8 w-24 rounded-lg" />
        </div>
      </div>
      {/* search skeleton */}
      <div className="skeleton h-10 w-full rounded-lg" />
      {/* filter row skeleton */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-8 w-56 rounded-lg" />
        <div className="skeleton h-8 w-44 rounded-lg" />
      </div>
      {/* rows skeleton */}
      <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="skeleton h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 w-40 rounded" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
            <div className="skeleton h-3 w-20 rounded hidden md:block" />
            <div className="skeleton h-3 w-28 rounded hidden lg:block" />
            <div className="skeleton h-3 w-24 rounded hidden xl:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inline Avatar ────────────────────────────────────────────────────────────

function InitialsAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const colorClass = getAvatarColor(name);
  const initials = getInitials(name);
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";

  return (
    <div
      className={`${sizeClass} ${colorClass} inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// ── Desktop Table ─────────────────────────────────────────────────────────────

function PropertiesTable({
  properties,
  onRowClick,
}: {
  properties: PropertyWithClient[];
  onRowClick: (property: PropertyWithClient) => void;
}) {
  if (properties.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 flex items-center justify-center h-48">
        <p className="text-sm text-muted-foreground">
          No se encontraron propiedades
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30">
            <th className="h-9 px-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground w-[30%]">
              Nombre
            </th>
            <th className="h-9 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell w-[22%]">
              Cliente
            </th>
            <th className="h-9 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell w-[16%]">
              Sistema
            </th>
            <th className="h-9 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden xl:table-cell w-[16%]">
              Ultimo servicio
            </th>
            <th className="h-9 px-3 w-16" aria-label="Accion" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {properties.map((property) => (
            <tr
              key={property.id}
              className="hover:bg-muted/40 cursor-pointer transition-colors"
              onClick={() => onRowClick(property)}
            >
              {/* Nombre */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={property.name} size="md" />
                  <div className="min-w-0">
                    <p className="font-medium text-[13px] truncate">
                      {property.name}
                    </p>
                    {property.address && (
                      <p className="text-xs text-muted-foreground truncate">
                        {property.address}
                      </p>
                    )}
                  </div>
                </div>
              </td>

              {/* Cliente */}
              <td className="px-3 py-3 hidden md:table-cell">
                <div className="flex items-center gap-2">
                  <InitialsAvatar name={property.client_name} size="sm" />
                  <span className="text-[13px] truncate max-w-[140px]">
                    {property.client_name}
                  </span>
                </div>
              </td>

              {/* Sistema */}
              <td className="px-3 py-3 text-[13px] text-muted-foreground hidden lg:table-cell">
                —
              </td>

              {/* Ultimo servicio */}
              <td className="px-3 py-3 text-[13px] text-muted-foreground hidden xl:table-cell">
                {relativeTime(property.updated_at)}
              </td>

              {/* Ver button */}
              <td
                className="px-3 py-3 text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onRowClick(property)}
                  className={buttonVariants({ size: "sm" }) + " text-xs"}
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Mobile Cards ──────────────────────────────────────────────────────────────

function PropertiesMobileList({
  properties,
  onItemClick,
}: {
  properties: PropertyWithClient[];
  onItemClick: (property: PropertyWithClient) => void;
}) {
  if (properties.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-10">
        No se encontraron propiedades
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/40">
      {properties.map((property) => (
        <div
          key={property.id}
          className="px-3.5 py-3 transition-colors active:bg-muted/50 cursor-pointer"
          onClick={() => onItemClick(property)}
        >
          <div className="flex items-center gap-3">
            <InitialsAvatar name={property.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate">{property.name}</p>
                <span className="text-xs text-muted-foreground shrink-0">
                  {relativeTime(property.updated_at)}
                </span>
              </div>
              {property.address && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {property.address}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {property.client_name}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────

type SortOption = {
  label: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

const SORT_OPTIONS: SortOption[] = [
  { label: "Mas reciente", sortBy: "created_at", sortOrder: "desc" },
  { label: "Nombre A-Z", sortBy: "name", sortOrder: "asc" },
  { label: "Nombre Z-A", sortBy: "name", sortOrder: "desc" },
];

function PropertiesContent() {
  const router = useRouter();
  const {
    page,
    search,
    sortBy,
    sortOrder,
    setPage,
    setSearch,
    setSortDirect,
    buildApiParams,
  } = useListParams({
    defaultSortBy: "created_at",
    defaultSortOrder: "desc",
    defaultPageSize: 20,
    filterKeys: [],
  });

  const [data, setData] = useState<PaginatedResponse<PropertyWithClient> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);
  const [activeTab, setActiveTab] = useState<"all" | "archived">("all");

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(buildApiParams());
      const res = await api.get<PaginatedResponse<PropertyWithClient>>(
        `/api/properties?${params}`
      );
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [buildApiParams]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

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
  const currentSortKey = SORT_OPTIONS.findIndex(
    (o) => o.sortBy === sortBy && o.sortOrder === sortOrder
  );
  const selectedSortIndex = currentSortKey === -1 ? 0 : currentSortKey;

  const handleSortChange = (index: number) => {
    const opt = SORT_OPTIONS[index];
    if (opt) {
      setSortDirect(opt.sortBy, opt.sortOrder);
    }
  };

  const totalCount = data ? data.total : null;

  const handleRowClick = (property: PropertyWithClient) => {
    router.push(
      `/dashboard/clients/${property.client_id}/properties/${property.id}`
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Propiedades</h1>
        <div className="flex items-center gap-2">
          <a
            href="#"
            className={buttonVariants({ variant: "outline", size: "sm" })}
            aria-label="Importar propiedades"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Importar
          </a>
          <Link
            href="#"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nueva Propiedad
          </Link>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar propiedades..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9 h-10 w-full"
          aria-label="Buscar propiedades"
        />
      </div>

      {/* ── Filter row ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* All / Archived toggle */}
        <div
          className="inline-flex items-center rounded-lg border border-border overflow-hidden text-sm"
          role="group"
          aria-label="Filtrar propiedades"
        >
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-pressed={activeTab === "all"}
          >
            {activeTab === "all" && totalCount !== null
              ? `${totalCount} Propiedades`
              : "Todas las Propiedades"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("archived")}
            className={`px-3 py-1.5 font-medium transition-colors border-l border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === "archived"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            aria-pressed={activeTab === "archived"}
          >
            Archivadas
          </button>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="properties-sort"
            className="text-sm text-muted-foreground shrink-0"
          >
            Ordenar:
          </label>
          <select
            id="properties-sort"
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
                <div className="skeleton h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3.5 w-40 rounded" />
                  <div className="skeleton h-3 w-28 rounded" />
                </div>
                <div className="skeleton h-3 w-20 rounded hidden md:block" />
                <div className="skeleton h-3 w-28 rounded hidden lg:block" />
                <div className="skeleton h-3 w-24 rounded hidden xl:block" />
              </div>
            ))}
          </div>
        </div>
      ) : data ? (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <PropertiesTable
              properties={data.items}
              onRowClick={handleRowClick}
            />
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            <PropertiesMobileList
              properties={data.items}
              onItemClick={handleRowClick}
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

export default function PropertiesPage() {
  return (
    <Suspense fallback={<PropertiesListSkeleton />}>
      <PropertiesContent />
    </Suspense>
  );
}
