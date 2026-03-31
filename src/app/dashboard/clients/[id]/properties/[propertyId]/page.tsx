"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, type Column } from "@/components/shared/data-table";
import { SystemsSection } from "@/components/irrigation-systems/systems-section";
import { api, FetchError } from "@/lib/api";
import type { Property, Client, Job, PaginatedResponse } from "@/lib/types";
import { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "@/lib/types";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";

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
      <Badge variant={j.status === "completed" ? "default" : "secondary"}>
        {JOB_STATUS_LABELS[j.status] ?? j.status}
      </Badge>
    ),
  },
  {
    key: "scheduled_date",
    header: "Fecha",
    className: "hidden sm:table-cell",
  },
];

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

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!property)
    return <p className="text-destructive">Propiedad no encontrada</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {client && (
            <Link
              href={`/dashboard/clients/${clientId}`}
              className="mb-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              {client.first_name} {client.last_name}
            </Link>
          )}
          <h1>{property.name}</h1>
          <p className="text-sm text-muted-foreground">{property.address}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/clients/${clientId}/properties/${propertyId}/edit`}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Direccion:</span>{" "}
            {property.address}
          </div>
          <div>
            <span className="text-muted-foreground">Ciudad:</span>{" "}
            {property.city || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Estado:</span>{" "}
            {property.state || "—"}
          </div>
          <div>
            <span className="text-muted-foreground">Codigo postal:</span>{" "}
            {property.zip_code || "—"}
          </div>
          {property.notes && (
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Notas:</span>{" "}
              {property.notes}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <SystemsSection propertyId={propertyId} />

      <Separator />

      {/* Jobs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Trabajos</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay trabajos registrados para esta propiedad.
          </p>
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
