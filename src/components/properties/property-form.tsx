"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, FetchError } from "@/lib/api";
import type { Property, PropertyCreate, PropertyUpdate } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

interface PropertyFormProps {
  clientId: string;
  property?: Property;
}

export function PropertyForm({ clientId, property }: PropertyFormProps) {
  const router = useRouter();
  const isEditing = !!property;

  const [form, setForm] = useState({
    name: property?.name ?? "",
    address: property?.address ?? "",
    city: property?.city ?? "",
    state: property?.state ?? "",
    zip_code: property?.zip_code ?? "",
    notes: property?.notes ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        address: form.address,
        city: form.city || null,
        state: form.state || null,
        zip_code: form.zip_code || null,
        notes: form.notes || null,
      };

      if (isEditing) {
        await api.patch<Property>(
          `/api/clients/${clientId}/properties/${property.id}`,
          payload as PropertyUpdate
        );
        router.push(`/dashboard/clients/${clientId}/properties/${property.id}`);
      } else {
        const created = await api.post<Property>(
          `/api/clients/${clientId}/properties`,
          payload as PropertyCreate
        );
        router.push(`/dashboard/clients/${clientId}/properties/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
      else setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6">
        {isEditing ? "Editar propiedad" : "Nueva propiedad"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Nombre *</Label>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            maxLength={255}
            placeholder="Ej: Casa principal"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-xs font-medium text-muted-foreground">Direccion *</Label>
          <Input
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            maxLength={500}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs font-medium text-muted-foreground">Ciudad</Label>
            <Input
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state" className="text-xs font-medium text-muted-foreground">Estado</Label>
            <Input
              id="state"
              name="state"
              value={form.state}
              onChange={handleChange}
              maxLength={50}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zip_code" className="text-xs font-medium text-muted-foreground">Codigo postal</Label>
            <Input
              id="zip_code"
              name="zip_code"
              value={form.zip_code}
              onChange={handleChange}
              maxLength={10}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground">Notas</Label>
          <Textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" size="sm" disabled={loading}>
            {loading
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear propiedad"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
