"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SystemFormDialog } from "./system-form-dialog";
import { api, FetchError } from "@/lib/api";
import type { IrrigationSystem, PaginatedResponse } from "@/lib/types";
import { Droplets, Pencil, Plus, Trash2 } from "lucide-react";

interface SystemsSectionProps {
  propertyId: string;
}

export function SystemsSection({ propertyId }: SystemsSectionProps) {
  const [systems, setSystems] = useState<IrrigationSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<
    IrrigationSystem | undefined
  >();
  const [deleteTarget, setDeleteTarget] = useState<IrrigationSystem | null>(
    null
  );

  const fetchSystems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<IrrigationSystem>>(
        `/api/properties/${propertyId}/systems?size=50`
      );
      setSystems(res.items);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  function handleEdit(system: IrrigationSystem) {
    setEditingSystem(system);
    setFormOpen(true);
  }

  function handleNew() {
    setEditingSystem(undefined);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(
        `/api/properties/${propertyId}/systems/${deleteTarget.id}`
      );
      setDeleteTarget(null);
      fetchSystems();
    } catch (err) {
      if (err instanceof FetchError) alert(err.detail);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sistemas de riego
        </p>
        <Button size="sm" className="h-8" onClick={handleNew}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Agregar
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="skeleton h-24 w-full" />
          ))}
        </div>
      ) : systems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-8 text-muted-foreground">
          <Droplets className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">Sin sistemas de riego</p>
          <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={handleNew}>
            Agregar sistema
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {systems.map((s) => (
            <div key={s.id} className="rounded-lg border border-border/60 p-3.5">
              <div className="flex items-start gap-2.5">
                <Droplets className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.system_type}
                  </p>
                  {s.zone_count && (
                    <p className="text-xs text-muted-foreground">
                      {s.zone_count} zonas
                    </p>
                  )}
                  {s.install_date && (
                    <p className="text-xs text-muted-foreground">
                      Instalado: {s.install_date}
                    </p>
                  )}
                  {s.notes && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    onClick={() => handleEdit(s)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    onClick={() => setDeleteTarget(s)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SystemFormDialog
        propertyId={propertyId}
        system={editingSystem}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={fetchSystems}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar sistema"
        description={`¿Estas seguro de eliminar "${deleteTarget?.name}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
