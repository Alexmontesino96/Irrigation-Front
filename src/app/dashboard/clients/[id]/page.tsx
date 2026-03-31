"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api, FetchError } from "@/lib/api";
import type { Client, Property, PaginatedResponse } from "@/lib/types";
import { Pencil, Trash2, Plus, MapPin } from "lucide-react";

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

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!client) return <p className="text-destructive">Cliente no encontrado</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>
            {client.first_name} {client.last_name}
          </h1>
          <Badge variant={client.is_active ? "default" : "secondary"} className="mt-1">
            {client.is_active ? "Activo" : "Inactivo"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/clients/${id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informacion de contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Email:</span>{" "}
            {client.email || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Telefono:</span>{" "}
            {client.phone || "—"}
          </div>
          {client.notes && (
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Notas:</span>{" "}
              {client.notes}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Propiedades</h2>
          <Link
            href={`/dashboard/clients/${id}/properties/new`}
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva propiedad
          </Link>
        </div>

        {properties.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este cliente no tiene propiedades registradas.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {properties.map((p) => (
              <Card
                key={p.id}
                className="cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => router.push(`/dashboard/clients/${id}/properties/${p.id}`)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {p.address}
                    </p>
                    {p.city && (
                      <p className="text-sm text-muted-foreground">
                        {p.city}
                        {p.state ? `, ${p.state}` : ""}{" "}
                        {p.zip_code || ""}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
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
