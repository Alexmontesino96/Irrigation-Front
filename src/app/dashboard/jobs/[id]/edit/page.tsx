"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { JobForm } from "@/components/jobs/job-form";
import { api, FetchError } from "@/lib/api";
import type { Job } from "@/lib/types";

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<Job>(`/api/jobs/${id}`)
      .then(setJob)
      .catch((err) => {
        if (err instanceof FetchError) setError(err.detail);
        else setError("Error al cargar trabajo");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!job) return <p className="text-destructive">Trabajo no encontrado</p>;

  return (
    <div className="space-y-4">
      <h1>Editar trabajo</h1>
      <JobForm job={job} />
    </div>
  );
}
