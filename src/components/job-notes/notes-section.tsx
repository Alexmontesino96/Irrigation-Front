"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api, FetchError } from "@/lib/api";
import type { JobNote, PaginatedResponse } from "@/lib/types";
import { Pencil, Trash2, Send } from "lucide-react";

interface NotesSectionProps {
  jobId: string;
}

export function NotesSection({ jobId }: NotesSectionProps) {
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<JobNote | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<JobNote>>(
        `/api/jobs/${jobId}/notes?size=100`
      );
      setNotes(res.items);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleAdd() {
    if (!newContent.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/jobs/${jobId}/notes`, { content: newContent });
      setNewContent("");
      fetchNotes();
    } catch (err) {
      if (err instanceof FetchError) alert(err.detail);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(noteId: string) {
    if (!editContent.trim()) return;
    try {
      await api.patch(`/api/jobs/${jobId}/notes/${noteId}`, {
        content: editContent,
      });
      setEditingId(null);
      fetchNotes();
    } catch (err) {
      if (err instanceof FetchError) alert(err.detail);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/jobs/${jobId}/notes/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchNotes();
    } catch (err) {
      if (err instanceof FetchError) alert(err.detail);
    }
  }

  function startEdit(note: JobNote) {
    setEditingId(note.id);
    setEditContent(note.content);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Notas</h2>

      {/* Add note */}
      <div className="flex gap-2">
        <Textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Agregar una nota..."
          rows={2}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button
          size="icon"
          onClick={handleAdd}
          disabled={submitting || !newContent.trim()}
          className="shrink-0 self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Notes list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay notas.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-3">
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(note.id)}
                      >
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleString("es")}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startEdit(note)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(note)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar nota"
        description="¿Estas seguro de eliminar esta nota?"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
