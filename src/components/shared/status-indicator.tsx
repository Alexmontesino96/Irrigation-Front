"use client";

import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-[var(--status-scheduled)]",
  in_progress: "bg-[var(--status-in-progress)]",
  completed: "bg-[var(--status-completed)]",
  cancelled: "bg-[var(--status-cancelled)]",
  pending: "bg-[var(--status-pending)]",
  overdue: "bg-[var(--status-overdue)]",
};

interface StatusIndicatorProps {
  status: string;
  label: string;
  className?: string;
}

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          STATUS_COLORS[status] ?? "bg-muted-foreground"
        )}
      />
      {label}
    </span>
  );
}
