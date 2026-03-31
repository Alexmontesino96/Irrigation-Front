"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { api, FetchError } from "@/lib/api";
import type { IrrigationSystem } from "@/lib/types";

const SYSTEM_TYPES = [
  "sprinkler",
  "drip",
  "rotor",
  "micro-spray",
  "bubbler",
  "mixed",
];

interface SystemFormDialogProps {
  propertyId: string;
  system?: IrrigationSystem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function SystemFormDialog({
  propertyId,
  system,
  open,
  onOpenChange,
  onSaved,
}: SystemFormDialogProps) {
  const isEditing = !!system;

  const [form, setForm] = useState({
    name: system?.name ?? "",
    system_type: system?.system_type ?? "sprinkler",
    zone_count: system?.zone_count?.toString() ?? "",
    install_date: system?.install_date ?? "",
    notes: system?.notes ?? "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
        system_type: form.system_type,
        zone_count: form.zone_count ? parseInt(form.zone_count) : null,
        install_date: form.install_date || null,
        notes: form.notes || null,
      };

      if (isEditing) {
        await api.patch(
          `/api/properties/${propertyId}/systems/${system.id}`,
          payload
        );
      } else {
        await api.post(`/api/properties/${propertyId}/systems`, payload);
      }

      onSaved();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
      else setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar sistema" : "Nuevo sistema de riego"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sys-name">Nombre *</Label>
            <Input
              id="sys-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={255}
              placeholder="Ej: Sistema zona frontal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sys-type">Tipo *</Label>
            <select
              id="sys-type"
              name="system_type"
              value={form.system_type}
              onChange={handleChange}
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {SYSTEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1).replace("-", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sys-zones">Zonas</Label>
              <Input
                id="sys-zones"
                name="zone_count"
                type="number"
                min={1}
                value={form.zone_count}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sys-date">Fecha instalacion</Label>
              <Input
                id="sys-date"
                name="install_date"
                type="date"
                value={form.install_date}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sys-notes">Notas</Label>
            <Textarea
              id="sys-notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Crear sistema"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
