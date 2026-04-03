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
import { api } from "@/lib/api";
import type { Job } from "@/lib/types";

interface RescheduleJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  onRescheduled: () => void;
}

export function RescheduleJobDialog({
  open,
  onOpenChange,
  job,
  onRescheduled,
}: RescheduleJobDialogProps) {
  const [scheduledDate, setScheduledDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!scheduledDate) return;
    setSubmitting(true);
    try {
      await api.patch<Job>(`/api/jobs/${job.id}`, {
        scheduled_date: scheduledDate,
      });
      onOpenChange(false);
      setScheduledDate("");
      onRescheduled();
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
          <DialogTitle>Reprogramar trabajo</DialogTitle>
          <DialogDescription>
            Nueva fecha para &quot;{job.title}&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="new-date" className="text-xs font-medium text-muted-foreground">Nueva fecha programada</Label>
          <Input
            id="new-date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            required
          />
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
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !scheduledDate}
          >
            {submitting ? "Reprogramando..." : "Reprogramar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
