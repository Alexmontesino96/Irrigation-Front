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
import type { Client, PaginatedResponse } from "@/lib/types";
import { Plus, Search, ChevronRight } from "lucide-react";

const columns: Column<Client>[] = [
  {
    key: "name",
    header: "Nombre",
    sortKey: "first_name",
    render: (c) => `${c.first_name} ${c.last_name}`,
  },
  {
    key: "email",
    header: "Email",
    sortKey: "email",
    className: "hidden sm:table-cell",
    render: (c) => c.email || "—",
  },
  {
    key: "phone",
    header: "Telefono",
    className: "hidden md:table-cell",
    render: (c) => c.phone || "—",
  },
  {
    key: "is_active",
    header: "Estado",
    render: (c) =>
      c.is_active ? null : (
        <StatusIndicator status="cancelled" label="Inactivo" />
      ),
  },
];

function ClientsListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton h-14 w-full" />
      ))}
    </div>
  );
}

function ClientsContent() {
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
    defaultSortBy: "created_at",
    defaultSortOrder: "desc",
    defaultPageSize: 10,
    filterKeys: ["is_active"],
  });

  const [data, setData] = useState<PaginatedResponse<Client> | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(buildApiParams());
      params.set("active_only", "false");
      const isActiveParam = params.get("is_active");
      if (isActiveParam === "all") {
        params.delete("is_active");
      } else if (!isActiveParam) {
        params.set("is_active", "true");
      }
      const res = await api.get<PaginatedResponse<Client>>(
        `/api/clients?${params}`
      );
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [buildApiParams]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const activeFilter = filters.is_active === "false" ? "inactive" : filters.is_active === "all" ? "all" : "active";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Clientes</h1>
        <Link href="/dashboard/clients/new" className={buttonVariants({ size: "sm", className: "h-10 px-4 md:h-8 md:px-2.5" })}>
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
          className="flex gap-2 max-w-sm flex-1 min-w-[200px]"
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email, telefono..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>
        <select
          value={activeFilter}
          onChange={(e) => {
            const v = e.target.value;
            setFilter("is_active", v === "active" ? null : v === "inactive" ? "false" : "all");
          }}
          className="flex h-8 rounded-lg border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="all">Todos</option>
        </select>
      </div>

      {loading && !data ? (
        <ClientsListSkeleton />
      ) : data ? (
        <>
          <ResponsiveList
            columns={columns}
            data={data.items}
            onItemClick={(c) => router.push(`/dashboard/clients/${c.id}`)}
            emptyMessage="No se encontraron clientes"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={setSort}
            renderCard={(c) => (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0">
                  {c.first_name[0]}{c.last_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {c.first_name} {c.last_name}
                    </p>
                    {!c.is_active && (
                      <span className="text-xs text-muted-foreground">Inactivo</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.phone || c.email || "Sin contacto"}
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

export default function ClientsPage() {
  return (
    <Suspense fallback={<ClientsListSkeleton />}>
      <ClientsContent />
    </Suspense>
  );
}
