"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, FetchError } from "@/lib/api";
import type {
  Job,
  Client,
  Property,
  PaginatedResponse,
} from "@/lib/types";
import {
  JOB_TYPE,
  JOB_TYPE_LABELS,
  JOB_STATUS,
  JOB_STATUS_LABELS,
} from "@/lib/types";
import { X, AlertTriangle } from "lucide-react";

interface JobFormProps {
  job?: Job;
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

export function JobForm({ job }: JobFormProps) {
  const router = useRouter();
  const isEditing = !!job;

  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  const [form, setForm] = useState({
    property_id: job?.property_id ?? "",
    title: job?.title ?? "",
    description: job?.description ?? "",
    job_type: job?.job_type ?? JOB_TYPE.MAINTENANCE,
    status: job?.status ?? JOB_STATUS.SCHEDULED,
    scheduled_date: job?.scheduled_date ?? "",
    completed_date: job?.completed_date ?? "",
    price: job?.price?.toString() ?? "",
    notes: job?.notes ?? "",
  });
  const [reminderDays, setReminderDays] = useState<number[]>(
    job?.reminder_days ?? []
  );
  const [newReminderDay, setNewReminderDay] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<PaginatedResponse<Client>>("/api/clients?size=100")
      .then((res) => setClients(res.items))
      .catch(() => {});
  }, []);

  const fetchProperties = useCallback(async (clientId: string) => {
    if (!clientId) {
      setProperties([]);
      return;
    }
    try {
      const res = await api.get<PaginatedResponse<Property>>(
        `/api/clients/${clientId}/properties?size=100`
      );
      setProperties(res.items);
    } catch {
      setProperties([]);
    }
  }, []);

  useEffect(() => {
    if (isEditing && job.property_id && clients.length > 0) {
      (async () => {
        for (const c of clients) {
          try {
            const res = await api.get<PaginatedResponse<Property>>(
              `/api/clients/${c.id}/properties?size=100`
            );
            const match = res.items.find((p) => p.id === job.property_id);
            if (match) {
              setSelectedClientId(c.id);
              setProperties(res.items);
              break;
            }
          } catch {
            // continue
          }
        }
      })();
    }
  }, [isEditing, job?.property_id, clients]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleClientChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const clientId = e.target.value;
    setSelectedClientId(clientId);
    setForm((prev) => ({ ...prev, property_id: "" }));
    fetchProperties(clientId);
  }

  function addReminderDay() {
    const days = parseInt(newReminderDay);
    if (days > 0 && !reminderDays.includes(days)) {
      setReminderDays((prev) => [...prev, days].sort((a, b) => a - b));
      setNewReminderDay("");
    }
  }

  function removeReminderDay(day: number) {
    setReminderDays((prev) => prev.filter((d) => d !== day));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description || null,
        job_type: form.job_type,
        scheduled_date: form.scheduled_date,
        price: form.price ? parseFloat(form.price) : null,
        reminder_days: reminderDays.length > 0 ? reminderDays : null,
        notes: form.notes || null,
      };

      if (isEditing) {
        payload.status = form.status;
        if (form.completed_date) payload.completed_date = form.completed_date;
        await api.patch<Job>(`/api/jobs/${job.id}`, payload);
        router.push(`/dashboard/jobs/${job.id}`);
      } else {
        payload.property_id = form.property_id;
        const created = await api.post<Job>("/api/jobs", payload);
        router.push(`/dashboard/jobs/${created.id}`);
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
      <h1 className="mb-6">{isEditing ? "Editar trabajo" : "Nuevo trabajo"}</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        {!isEditing && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="client" className="text-xs font-medium text-muted-foreground">Cliente *</Label>
              <select
                id="client"
                value={selectedClientId}
                onChange={handleClientChange}
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
            <div className="space-y-1.5">
              <Label htmlFor="property_id" className="text-xs font-medium text-muted-foreground">Propiedad *</Label>
              <select
                id="property_id"
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
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">Titulo *</Label>
          <Input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            maxLength={255}
            placeholder="Ej: Mantenimiento trimestral"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="job_type" className="text-xs font-medium text-muted-foreground">Tipo</Label>
            <select
              id="job_type"
              name="job_type"
              value={form.job_type}
              onChange={handleChange}
              className={selectClass}
            >
              {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-medium text-muted-foreground">Estado</Label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className={selectClass}
              >
                {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="scheduled_date" className="text-xs font-medium text-muted-foreground">Fecha programada *</Label>
            <Input
              id="scheduled_date"
              name="scheduled_date"
              type="date"
              value={form.scheduled_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price" className="text-xs font-medium text-muted-foreground">Precio ($)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min={0}
              step={0.01}
              value={form.price}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
        </div>

        {isEditing && form.status === JOB_STATUS.COMPLETED && (
          <div className="space-y-1.5">
            <Label htmlFor="completed_date" className="text-xs font-medium text-muted-foreground">Fecha completado</Label>
            <Input
              id="completed_date"
              name="completed_date"
              type="date"
              value={form.completed_date}
              onChange={handleChange}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Dias de recordatorio</Label>
          <p className="text-xs text-muted-foreground">
            Al completar el trabajo, se crearan recordatorios automaticos
            estos dias despues.
          </p>
          {reminderDays.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {reminderDays.map((day) => (
                <span key={day} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                  {day}d
                  <button
                    type="button"
                    onClick={() => removeReminderDay(day)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              value={newReminderDay}
              onChange={(e) => setNewReminderDay(e.target.value)}
              placeholder="Ej: 30"
              className="w-24"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addReminderDay();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addReminderDay}
            >
              Agregar
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs font-medium text-muted-foreground">Descripcion</Label>
          <Textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground">Notas</Label>
          <Textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
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
                : "Crear trabajo"}
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
