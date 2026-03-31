"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Pagination } from "@/components/shared/pagination";
import { api } from "@/lib/api";
import type { Client, PaginatedResponse } from "@/lib/types";
import { Plus, Search } from "lucide-react";

const PAGE_SIZE = 10;

const columns: Column<Client>[] = [
  {
    key: "name",
    header: "Nombre",
    render: (c) => `${c.first_name} ${c.last_name}`,
  },
  {
    key: "email",
    header: "Email",
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
    render: (c) => (
      <Badge variant={c.is_active ? "default" : "secondary"}>
        {c.is_active ? "Activo" : "Inactivo"}
      </Badge>
    ),
  },
];

export default function ClientsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<Client> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("active");
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
        active_only: "false",
      });
      if (search) params.set("search", search);
      if (activeFilter !== "all") params.set("is_active", activeFilter === "active" ? "true" : "false");
      const res = await api.get<PaginatedResponse<Client>>(
        `/api/clients?${params}`
      );
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchClients();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Clientes</h1>
        <Link href="/dashboard/clients/new" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo cliente
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email, telefono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="all">Todos</option>
        </select>
      </div>

      {loading && !data ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : data ? (
        <>
          <DataTable
            columns={columns}
            data={data.items}
            onRowClick={(c) => router.push(`/dashboard/clients/${c.id}`)}
            emptyMessage="No se encontraron clientes"
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
