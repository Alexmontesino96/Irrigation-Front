"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { Job, JobNote } from "@/lib/types";

interface CompleteJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  onCompleted: () => void;
}

export function CompleteJobDialog({
  open,
  onOpenChange,
  job,
  onCompleted,
}: CompleteJobDialogProps) {
  const today = new Date().toISOString().split("T")[0];
  const [completedDate, setCompletedDate] = useState(today);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (note.trim()) {
        await api.post<JobNote>(`/api/jobs/${job.id}/notes`, {
          content: note.trim(),
        });
      }
      await api.patch<Job>(`/api/jobs/${job.id}`, {
        status: "completed",
        completed_date: completedDate,
      });
      onOpenChange(false);
      setNote("");
      setCompletedDate(today);
      onCompleted();
    } catch {
      // error handled by caller
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Completar trabajo</DialogTitle>
          <DialogDescription>
            Completar &quot;{job.title}&quot;?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="completed-date" className="text-xs font-medium text-muted-foreground">Fecha completado</Label>
            <Input
              id="completed-date"
              type="date"
              value={completedDate}
              onChange={(e) => setCompletedDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="completion-note" className="text-xs font-medium text-muted-foreground">
              Notas de cierre (opcional)
            </Label>
            <Textarea
              id="completion-note"
              placeholder="Agregar notas sobre el trabajo realizado..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Completando..." : "Completar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
