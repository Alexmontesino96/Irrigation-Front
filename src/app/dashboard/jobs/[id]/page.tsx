"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CompleteJobDialog } from "@/components/jobs/complete-job-dialog";
import { NotesSection } from "@/components/job-notes/notes-section";
import { api, FetchError } from "@/lib/api";
import type { Job, Reminder, PaginatedResponse } from "@/lib/types";
import {
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  REMINDER_STATUS_LABELS,
} from "@/lib/types";
import { Pencil, Trash2, Clock, CheckCircle } from "lucide-react";

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

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

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
