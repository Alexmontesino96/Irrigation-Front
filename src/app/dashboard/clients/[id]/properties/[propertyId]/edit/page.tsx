"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PropertyForm } from "@/components/properties/property-form";
import { api, FetchError } from "@/lib/api";
import type { Property } from "@/lib/types";

export default function EditPropertyPage() {
  const { id: clientId, propertyId } = useParams<{
    id: string;
    propertyId: string;
  }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Property>(`/api/clients/${clientId}/properties/${propertyId}`)
      .then(setProperty)
      .catch((err) => {
        if (err instanceof FetchError) setError(err.detail);
        else setError("Error al cargar propiedad");
      })
      .finally(() => setLoading(false));
  }, [clientId, propertyId]);

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!property)
    return <p className="text-destructive">Propiedad no encontrada</p>;

  return (
    <div className="space-y-4">
      <h1>Editar propiedad</h1>
      <PropertyForm clientId={clientId} property={property} />
    </div>
  );
}
