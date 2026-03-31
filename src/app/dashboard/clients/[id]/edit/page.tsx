"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";
import { api, FetchError } from "@/lib/api";
import type { Client } from "@/lib/types";

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Client>(`/api/clients/${id}`)
      .then(setClient)
      .catch((err) => {
        if (err instanceof FetchError) setError(err.detail);
        else setError("Error al cargar cliente");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!client) return <p className="text-destructive">Cliente no encontrado</p>;

  return (
    <div className="space-y-4">
      <h1>Editar cliente</h1>
      <ClientForm client={client} />
    </div>
  );
}
