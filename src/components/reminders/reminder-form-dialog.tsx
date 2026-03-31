"use client";

import { useEffect, useState } from "react";
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
import type { Client, Property, PaginatedResponse } from "@/lib/types";

interface ReminderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function ReminderFormDialog({
  open,
  onOpenChange,
  onSaved,
}: ReminderFormDialogProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  const [form, setForm] = useState({
    property_id: "",
    title: "",
    description: "",
    remind_date: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      api
        .get<PaginatedResponse<Client>>("/api/clients?size=100")
        .then((res) => setClients(res.items))
        .catch(() => {});
    }
  }, [open]);

  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId);
    setForm((prev) => ({ ...prev, property_id: "" }));
    if (clientId) {
      api
        .get<PaginatedResponse<Property>>(
          `/api/clients/${clientId}/properties?size=100`
        )
        .then((res) => setProperties(res.items))
        .catch(() => setProperties([]));
    } else {
      setProperties([]);
    }
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/api/reminders", {
        property_id: form.property_id,
        title: form.title,
        description: form.description || null,
        remind_date: form.remind_date,
      });
      // Reset form
      setForm({ property_id: "", title: "", description: "", remind_date: "" });
      setSelectedClientId("");
      setProperties([]);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
      else setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const selectClass =
    "flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo recordatorio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rem-client">Cliente *</Label>
            <select
              id="rem-client"
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              required
              className={selectClass}
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rem-property">Propiedad *</Label>
            <select
              id="rem-property"
              name="property_id"
              value={form.property_id}
              onChange={handleChange}
              required
              disabled={!selectedClientId}
              className={selectClass}
            >
              <option value="">
                {selectedClientId
                  ? "Seleccionar propiedad..."
                  : "Primero selecciona un cliente"}
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.address}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rem-title">Titulo *</Label>
            <Input
              id="rem-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={255}
              placeholder="Ej: Revision trimestral"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rem-date">Fecha *</Label>
            <Input
              id="rem-date"
              name="remind_date"
              type="date"
              value={form.remind_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rem-desc">Descripcion</Label>
            <Textarea
              id="rem-desc"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear recordatorio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
