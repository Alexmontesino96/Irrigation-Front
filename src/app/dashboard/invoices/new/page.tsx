"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, FetchError } from "@/lib/api";
import type {
  Invoice,
  Client,
  Job,
  JobMaterial,
  PaginatedResponse,
  InvoiceItemCreate,
} from "@/lib/types";
import { AlertTriangle, Check, Plus, Trash2 } from "lucide-react";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItemCreate[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load for "import from job"
  const [clientJobs, setClientJobs] = useState<Job[]>([]);

  useEffect(() => {
    api
      .get<PaginatedResponse<Client>>("/api/clients?size=100")
      .then((res) => setClients(res.items))
      .catch(() => {});
  }, []);

  const fetchClientJobs = useCallback(async (cId: string) => {
    if (!cId) {
      setClientJobs([]);
      return;
    }
    try {
      // Get client's properties first
      const propRes = await api.get<PaginatedResponse<{ id: string }>>(
        `/api/clients/${cId}/properties?size=100`
      );
      if (propRes.items.length === 0) {
        setClientJobs([]);
        return;
      }
      // Fetch completed jobs for each property in parallel
      const jobResults = await Promise.all(
        propRes.items.map((p) =>
          api
            .get<PaginatedResponse<Job>>(
              `/api/jobs?property_id=${p.id}&status=completed&size=20`
            )
            .catch(() => ({ items: [] as Job[] }))
        )
      );
      const allJobs = jobResults
        .flatMap((r) => r.items)
        .sort(
          (a, b) =>
            new Date(b.scheduled_date).getTime() -
            new Date(a.scheduled_date).getTime()
        );
      setClientJobs(allJobs);
    } catch {
      setClientJobs([]);
    }
  }, []);

  useEffect(() => {
    if (clientId) fetchClientJobs(clientId);
    setImportedJobId(null);
    setItems([{ description: "", quantity: 1, unit_price: 0 }]);
  }, [clientId, fetchClientJobs]);

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unit_price: 0 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: string, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  const [importedJobId, setImportedJobId] = useState<string | null>(null);

  async function importFromJob(job: Job) {
    setError("");
    try {
      // Fetch job materials
      const matsRes = await api.get<JobMaterial[]>(
        `/api/jobs/${job.id}/materials`
      );

      const newItems: InvoiceItemCreate[] = [];

      // Add job service as first item
      if (job.price) {
        newItems.push({
          description: job.title,
          quantity: 1,
          unit_price: job.price,
        });
      }

      // Add materials
      for (const mat of matsRes) {
        newItems.push({
          description: mat.name,
          quantity: mat.quantity,
          unit_price: mat.unit_cost,
        });
      }

      if (newItems.length === 0) {
        setError("El trabajo no tiene precio ni materiales para facturar");
        return;
      }

      setItems(newItems);
      setImportedJobId(job.id);
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
      else setError("Error al importar datos del trabajo");
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity || 1) * (item.unit_price || 0),
    0
  );
  const taxAmount = subtotal * (parseFloat(taxRate) || 0) / 100;
  const total = subtotal + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const inv = await api.post<Invoice>("/api/invoices", {
        client_id: clientId,
        issue_date: issueDate,
        due_date: dueDate,
        tax_rate: parseFloat(taxRate) || 0,
        notes: notes || null,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
        })),
      });
      router.push(`/dashboard/invoices/${inv.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
      else setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6">Nueva factura</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Cliente *</Label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
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

        {clientId && clientJobs.length > 0 && (
          <div className="rounded-md border border-border/60 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Importar desde trabajo completado
            </p>
            <div className="space-y-1">
              {clientJobs.slice(0, 10).map((j) => (
                <button
                  key={j.id}
                  type="button"
                  disabled={importedJobId === j.id}
                  className="flex items-center gap-2 w-full text-left rounded px-2 py-1.5 text-sm hover:bg-muted/50 disabled:opacity-60"
                  onClick={() => importFromJob(j)}
                >
                  {importedJobId === j.id && (
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  )}
                  <span className={importedJobId === j.id ? "text-emerald-600" : ""}>
                    {j.title} — {j.scheduled_date}
                    {j.price != null && ` · $${j.price.toFixed(2)}`}
                    {j.property_name && <span className="text-muted-foreground"> · {j.property_name}</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Fecha emision *</Label>
            <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Fecha vencimiento *</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Impuesto (%)</Label>
            <Input type="number" min={0} step={0.01} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Items
            </p>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-1 h-3 w-3" />
              Item
            </Button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Descripcion</Label>}
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(idx, "description", e.target.value)}
                  placeholder="Descripcion del item"
                  required
                />
              </div>
              <div className="w-20 space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Cant.</Label>}
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="w-28 space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Precio</Label>}
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.unit_price}
                  onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="w-24 text-right space-y-1">
                {idx === 0 && <Label className="text-xs text-muted-foreground">Total</Label>}
                <p className="h-9 flex items-center justify-end text-sm">
                  ${((item.quantity || 1) * (item.unit_price || 0)).toFixed(2)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeItem(idx)}
                disabled={items.length <= 1}
                className="mb-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          <div className="border-t border-border/40 pt-3 space-y-1 text-right text-sm">
            <p>Subtotal: <span className="font-medium">${subtotal.toFixed(2)}</span></p>
            <p>Impuesto ({taxRate}%): <span className="font-medium">${taxAmount.toFixed(2)}</span></p>
            <p className="text-base font-semibold">Total: ${total.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Notas</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Creando..." : "Crear factura"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
