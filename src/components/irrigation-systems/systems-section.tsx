"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      // silently fail - section is secondary
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
        <h2 className="text-lg font-semibold">Sistemas de riego</h2>
        <Button size="sm" onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : systems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay sistemas de riego registrados.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {systems.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <Droplets className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Tipo: {s.system_type}
                  </p>
                  {s.zone_count && (
                    <p className="text-sm text-muted-foreground">
                      Zonas: {s.zone_count}
                    </p>
                  )}
                  {s.install_date && (
                    <p className="text-sm text-muted-foreground">
                      Instalado: {s.install_date}
                    </p>
                  )}
                  {s.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEdit(s)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(s)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
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
