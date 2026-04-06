"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api, FetchError } from "@/lib/api";
import type { SmsTemplate } from "@/lib/types";
import { SMS_TYPE_LABELS } from "@/lib/types";
import { Plus, Pencil, Trash2, AlertTriangle, Inbox } from "lucide-react";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

export default function SmsTemplatesPage() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SmsTemplate | null>(null);
  const [form, setForm] = useState({ name: "", sms_type: "reminder", body: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await api.get<SmsTemplate[]>("/api/sms/templates");
      setTemplates(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function openNew() {
    setEditingTemplate(null);
    setForm({ name: "", sms_type: "reminder", body: "" });
    setFormOpen(true);
    setError("");
  }

  function openEdit(t: SmsTemplate) {
    setEditingTemplate(t);
    setForm({ name: t.name, sms_type: t.sms_type, body: t.body });
    setFormOpen(true);
    setError("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (editingTemplate) {
        await api.patch(`/api/sms/templates/${editingTemplate.id}`, form);
      } else {
        await api.post("/api/sms/templates", form);
      }
      setFormOpen(false);
      fetchTemplates();
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/sms/templates/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err) {
      if (err instanceof FetchError) alert(err.detail);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Templates SMS</h1>
        <Button size="sm" className="h-10 md:h-8" onClick={openNew}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nuevo
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Placeholders disponibles: {"{client_name}"}, {"{date}"}, {"{service}"}
      </p>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Inbox className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No hay templates creados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-border/60 p-3.5"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{t.name}</p>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
                    {SMS_TYPE_LABELS[t.sms_type] ?? t.sms_type}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(t)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(t)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Form dialog inline */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg border border-border p-6 w-full max-w-md space-y-4">
            <h2>{editingTemplate ? "Editar template" : "Nuevo template"}</h2>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Recordatorio de servicio"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Tipo *</Label>
              <select
                value={form.sms_type}
                onChange={(e) => setForm((f) => ({ ...f, sms_type: e.target.value }))}
                className={selectClass}
              >
                {Object.entries(SMS_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Mensaje *</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={4}
                placeholder="Hola {client_name}, le recordamos..."
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar template"
        description={`¿Eliminar template "${deleteTarget?.name}"?`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
