"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api, FetchError } from "@/lib/api";
import type { Client, Property, PaginatedResponse } from "@/lib/types";
import { Pencil, Trash2, Plus, MapPin } from "lucide-react";

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-6 w-48" />
          <div className="skeleton h-4 w-20" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-8 w-20" />
          <div className="skeleton h-8 w-20" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-5 w-32" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="skeleton h-5 w-28" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="skeleton h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        api.get<Client>(`/api/clients/${id}`),
        api.get<PaginatedResponse<Property>>(
          `/api/clients/${id}/properties?size=100`
        ),
      ]);
      setClient(c);
      setProperties(p.items);
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
      else setError("Error al cargar cliente");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete() {
    try {
      await api.delete(`/api/clients/${id}`);
      router.push("/dashboard/clients");
      router.refresh();
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
    }
  }

  if (loading) return <DetailSkeleton />;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!client) return <p className="text-destructive">Cliente no encontrado</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1>
            {client.first_name} {client.last_name}
          </h1>
          {!client.is_active && (
            <StatusIndicator status="cancelled" label="Inactivo" className="mt-1" />
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/clients/${id}/edit`}
            className={buttonVariants({ variant: "ghost", size: "sm", className: "text-muted-foreground" })}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Editar
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Eliminar
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Informacion de contacto
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm mt-0.5">{client.email || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Telefono</p>
            <p className="text-sm mt-0.5">{client.phone || "—"}</p>
          </div>
          {client.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Notas</p>
              <p className="text-sm mt-0.5">{client.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Propiedades
          </p>
          <Link
            href={`/dashboard/clients/${id}/properties/new`}
            className={buttonVariants({ size: "sm", className: "h-8" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nueva
          </Link>
        </div>

        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-8 text-muted-foreground">
            <MapPin className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Sin propiedades registradas</p>
            <Link
              href={`/dashboard/clients/${id}/properties/new`}
              className={buttonVariants({ variant: "ghost", size: "sm", className: "mt-2 text-xs" })}
            >
              Agregar propiedad
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {properties.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-border/60 p-3.5 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/dashboard/clients/${id}/properties/${p.id}`)}
              >
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {p.address}
                    </p>
                    {p.city && (
                      <p className="text-xs text-muted-foreground">
                        {p.city}
                        {p.state ? `, ${p.state}` : ""}{" "}
                        {p.zip_code || ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar cliente"
        description={`¿Estas seguro de eliminar a ${client.first_name} ${client.last_name}? El cliente sera marcado como inactivo.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
