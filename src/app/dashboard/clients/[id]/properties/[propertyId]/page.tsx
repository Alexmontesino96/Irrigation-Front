"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type Column } from "@/components/shared/data-table";
import { SystemsSection } from "@/components/irrigation-systems/systems-section";
import { api, FetchError } from "@/lib/api";
import type { Property, Client, Job, PaginatedResponse } from "@/lib/types";
import { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "@/lib/types";
import { Pencil, Trash2, ArrowLeft, Inbox } from "lucide-react";

const jobColumns: Column<Job>[] = [
  { key: "title", header: "Titulo" },
  {
    key: "job_type",
    header: "Tipo",
    render: (j) => JOB_TYPE_LABELS[j.job_type] ?? j.job_type,
  },
  {
    key: "status",
    header: "Estado",
    render: (j) => (
      <StatusIndicator
        status={j.status}
        label={JOB_STATUS_LABELS[j.status] ?? j.status}
      />
    ),
  },
  {
    key: "scheduled_date",
    header: "Fecha",
    className: "hidden sm:table-cell",
  },
];

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-4 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="skeleton h-3 w-16" />
            <div className="skeleton h-5 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id: clientId, propertyId } = useParams<{
    id: string;
    propertyId: string;
  }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [propRes, clientRes, jobsRes] = await Promise.all([
        api.get<Property>(
          `/api/clients/${clientId}/properties/${propertyId}`
        ),
        api.get<Client>(`/api/clients/${clientId}`),
        api.get<PaginatedResponse<Job>>(
          `/api/jobs?property_id=${propertyId}&size=50`
        ),
      ]);
      setProperty(propRes);
      setClient(clientRes);
      setJobs(jobsRes.items);
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
      else setError("Error al cargar propiedad");
    } finally {
      setLoading(false);
    }
  }, [clientId, propertyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete() {
    try {
      await api.delete(
        `/api/clients/${clientId}/properties/${propertyId}`
      );
      router.push(`/dashboard/clients/${clientId}`);
      router.refresh();
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
    }
  }

  if (loading) return <DetailSkeleton />;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!property)
    return <p className="text-destructive">Propiedad no encontrada</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          {client && (
            <Link
              href={`/dashboard/clients/${clientId}`}
              className="mb-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              {client.first_name} {client.last_name}
            </Link>
          )}
          <h1>{property.name}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{property.address}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/clients/${clientId}/properties/${propertyId}/edit`}
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
          Detalles
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Direccion</p>
            <p className="text-sm mt-0.5">{property.address}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ciudad</p>
            <p className="text-sm mt-0.5">{property.city || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estado</p>
            <p className="text-sm mt-0.5">{property.state || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Codigo postal</p>
            <p className="text-sm mt-0.5">{property.zip_code || "—"}</p>
          </div>
          {property.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Notas</p>
              <p className="text-sm mt-0.5">{property.notes}</p>
            </div>
          )}
        </div>
      </div>

      <SystemsSection propertyId={propertyId} />

      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Trabajos
        </p>
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-8 text-muted-foreground">
            <Inbox className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Sin trabajos registrados</p>
          </div>
        ) : (
          <DataTable
            columns={jobColumns}
            data={jobs}
            onRowClick={(j) => router.push(`/dashboard/jobs/${j.id}`)}
          />
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar propiedad"
        description={`¿Estas seguro de eliminar "${property.name}"? Esta accion no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
