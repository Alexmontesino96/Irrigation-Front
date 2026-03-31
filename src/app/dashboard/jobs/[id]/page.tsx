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
import { CompleteJobDialog } from "@/components/jobs/complete-job-dialog";
import { NotesSection } from "@/components/job-notes/notes-section";
import { api, FetchError } from "@/lib/api";
import type { Job, Reminder, PaginatedResponse } from "@/lib/types";
import {
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  REMINDER_STATUS_LABELS,
} from "@/lib/types";
import { Pencil, Trash2, Bell, Clock, CheckCircle } from "lucide-react";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  cancelled: "destructive",
};

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
      // Filter reminders for this job
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

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!job) return <p className="text-destructive">Trabajo no encontrado</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>{job.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={STATUS_COLORS[job.status] ?? "secondary"}>
              {JOB_STATUS_LABELS[job.status] ?? job.status}
            </Badge>
            <Badge variant="outline">
              {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {job.status !== "completed" && job.status !== "cancelled" && (
            <Button size="sm" onClick={() => setCompleteOpen(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Completar
            </Button>
          )}
          <Link
            href={`/dashboard/jobs/${id}/edit`}
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

      {/* Job details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles del trabajo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Fecha programada:</span>{" "}
            {job.scheduled_date}
          </div>
          <div>
            <span className="text-muted-foreground">Fecha completado:</span>{" "}
            {job.completed_date || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Precio:</span>{" "}
            {job.price != null ? `$${job.price.toFixed(2)}` : "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Recordatorios:</span>{" "}
            {job.reminder_days?.length
              ? job.reminder_days.map((d) => `${d}d`).join(", ")
              : "—"}
          </div>
          {job.description && (
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Descripcion:</span>{" "}
              {job.description}
            </div>
          )}
          {job.notes && (
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Notas:</span>{" "}
              {job.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reminders generated */}
      {reminders.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Recordatorios generados
            </h2>
            <div className="space-y-2">
              {reminders.map((r) => (
                <Card key={r.id}>
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.remind_date}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        r.status === "completed" ? "default" : "secondary"
                      }
                    >
                      {REMINDER_STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Notes (Module 5) */}
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
