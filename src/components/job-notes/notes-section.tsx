"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api, FetchError } from "@/lib/api";
import type { JobNote, PaginatedResponse } from "@/lib/types";
import { Pencil, Trash2, Send, MessageSquare } from "lucide-react";

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
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Notas
      </p>

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
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-6 text-muted-foreground">
          <MessageSquare className="h-6 w-6 mb-1.5 opacity-40" />
          <p className="text-sm">No hay notas</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {notes.map((note) => (
            <div key={note.id} className="py-3">
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
                      variant="ghost"
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
                  <div className="flex gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      onClick={() => startEdit(note)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground"
                      onClick={() => setDeleteTarget(note)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
