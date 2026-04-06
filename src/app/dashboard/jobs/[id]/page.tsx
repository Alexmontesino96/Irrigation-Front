"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CompleteJobDialog } from "@/components/jobs/complete-job-dialog";
import { NotesSection } from "@/components/job-notes/notes-section";
import { api, FetchError } from "@/lib/api";
import type { Job, Reminder, JobMaterial, Invoice, PaginatedResponse } from "@/lib/types";
import {
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  REMINDER_STATUS_LABELS,
} from "@/lib/types";
import { Pencil, Trash2, Clock, CheckCircle, Plus, FileText, X } from "lucide-react";

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-6 w-56" />
          <div className="flex gap-2">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-20" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-8 w-24" />
          <div className="skeleton h-8 w-20" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MaterialsSection({ jobId }: { jobId: string }) {
  const [materials, setMaterials] = useState<JobMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newCost, setNewCost] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchMaterials = useCallback(async () => {
    try {
      const res = await api.get<JobMaterial[]>(`/api/jobs/${jobId}/materials`);
      setMaterials(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  async function handleAdd() {
    if (!newName || !newCost) return;
    setSaving(true);
    try {
      await api.post(`/api/jobs/${jobId}/materials`, {
        name: newName,
        quantity: parseInt(newQty) || 1,
        unit_cost: parseFloat(newCost),
      });
      setNewName("");
      setNewQty("1");
      setNewCost("");
      setAdding(false);
      fetchMaterials();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(materialId: string) {
    try {
      await api.delete(`/api/jobs/${jobId}/materials/${materialId}`);
      fetchMaterials();
    } catch {
      // ignore
    }
  }

  const totalMaterials = materials.reduce((sum, m) => sum + m.total, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Materiales
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setAdding(true)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Agregar
        </Button>
      </div>

      {loading ? (
        <div className="skeleton h-10 w-full" />
      ) : materials.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">Sin materiales</p>
      ) : (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-xs">Material</th>
                <th className="px-3 py-2 text-right font-medium text-xs">Cant.</th>
                <th className="px-3 py-2 text-right font-medium text-xs">Costo Unit.</th>
                <th className="px-3 py-2 text-right font-medium text-xs">Total</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {materials.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2">{m.name}</td>
                  <td className="px-3 py-2 text-right">{m.quantity}</td>
                  <td className="px-3 py-2 text-right">${m.unit_cost.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">${m.total.toFixed(2)}</td>
                  <td className="px-1 py-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(m.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
              {adding && (
                <tr>
                  <td className="px-2 py-1.5">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nombre"
                      className="h-7 text-xs"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      min={1}
                      value={newQty}
                      onChange={(e) => setNewQty(e.target.value)}
                      className="h-7 text-xs w-16 text-right"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      placeholder="0.00"
                      className="h-7 text-xs w-20 text-right"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right text-xs">
                    ${((parseInt(newQty) || 0) * (parseFloat(newCost) || 0)).toFixed(2)}
                  </td>
                  <td className="px-1 py-1.5 flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleAdd}
                      disabled={saving}
                    >
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setAdding(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {materials.length > 0 && (
            <div className="border-t border-border/40 px-3 py-2 text-right text-sm font-medium">
              Total materiales: ${totalMaterials.toFixed(2)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [jobRes, remindersRes] = await Promise.all([
        api.get<Job>(`/api/jobs/${id}`),
        api.get<PaginatedResponse<Reminder>>(
          `/api/reminders?size=50`
        ),
      ]);
      setJob(jobRes);
      setReminders(remindersRes.items.filter((r) => r.job_id === id));
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
      else setError("Error al cargar trabajo");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete() {
    try {
      await api.delete(`/api/jobs/${id}`);
      router.push("/dashboard/jobs");
      router.refresh();
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
    }
  }

  async function handleCreateInvoice() {
    setCreatingInvoice(true);
    try {
      const inv = await api.post<Invoice>(`/api/invoices/from-job/${id}`, {});
      router.push(`/dashboard/invoices/${inv.id}`);
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
    } finally {
      setCreatingInvoice(false);
    }
  }

  if (loading) return <DetailSkeleton />;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!job) return <p className="text-destructive">Trabajo no encontrado</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1>{job.title}</h1>
          <div className="mt-1.5 flex items-center gap-3">
            <StatusIndicator
              status={job.status}
              label={JOB_STATUS_LABELS[job.status] ?? job.status}
            />
            <span className="text-xs text-muted-foreground">
              {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {job.status !== "completed" && job.status !== "cancelled" && (
            <Button size="sm" onClick={() => setCompleteOpen(true)}>
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              Completar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateInvoice}
            disabled={creatingInvoice}
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            {creatingInvoice ? "Creando..." : "Generar Factura"}
          </Button>
          <Link
            href={`/dashboard/jobs/${id}/edit`}
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
          Detalles del trabajo
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Fecha programada</p>
            <p className="text-sm mt-0.5">{job.scheduled_date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fecha completado</p>
            <p className="text-sm mt-0.5">{job.completed_date || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Precio</p>
            <p className="text-sm mt-0.5">
              {job.price != null ? `$${job.price.toFixed(2)}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Recordatorios</p>
            <p className="text-sm mt-0.5">
              {job.reminder_days?.length
                ? job.reminder_days.map((d) => `${d}d`).join(", ")
                : "—"}
            </p>
          </div>
          {job.description && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Descripcion</p>
              <p className="text-sm mt-0.5">{job.description}</p>
            </div>
          )}
          {job.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Notas</p>
              <p className="text-sm mt-0.5">{job.notes}</p>
            </div>
          )}
        </div>
      </div>

      <MaterialsSection jobId={id} />

      {reminders.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Recordatorios generados
          </p>
          <div className="divide-y divide-border/40">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.remind_date}
                    </p>
                  </div>
                </div>
                <StatusIndicator
                  status={r.status}
                  label={REMINDER_STATUS_LABELS[r.status] ?? r.status}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <NotesSection jobId={id} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar trabajo"
        description={`¿Estas seguro de eliminar "${job.title}"? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />

      {job.status !== "completed" && job.status !== "cancelled" && (
        <CompleteJobDialog
          open={completeOpen}
          onOpenChange={setCompleteOpen}
          job={job}
          onCompleted={fetchData}
        />
      )}
    </div>
  );
}
