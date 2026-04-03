"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { CompleteJobDialog } from "@/components/jobs/complete-job-dialog";
import { RescheduleJobDialog } from "@/components/jobs/reschedule-job-dialog";
import { api } from "@/lib/api";
import type {
  Reminder,
  Job,
  Client,
  PaginatedResponse,
} from "@/lib/types";
import {
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  REMINDER_STATUS_LABELS,
} from "@/lib/types";
import {
  Plus,
  ArrowRight,
  CheckCircle,
  CalendarClock,
  AlertTriangle,
  Calendar,
  Clock,
  Inbox,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Stats {
  totalClients: number;
  pendingJobs: number;
  upcomingReminders: number;
  overdueJobs: number;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border/60 p-3.5">
            <div className="skeleton h-3 w-20 mb-2" />
            <div className="skeleton h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="skeleton h-4 w-36" />
            {[...Array(3)].map((_, j) => (
              <div key={j} className="skeleton h-12 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [overdueJobs, setOverdueJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeJob, setCompleteJob] = useState<Job | null>(null);
  const [rescheduleJob, setRescheduleJob] = useState<Job | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      const [remRes, jobsRes, clientsRes, overdueRes] = await Promise.all([
        api.get<Reminder[]>("/api/reminders/upcoming?days=7"),
        api.get<PaginatedResponse<Job>>(
          "/api/jobs?status=scheduled&size=5"
        ),
        api.get<PaginatedResponse<Client>>("/api/clients?size=1"),
        api.get<PaginatedResponse<Job>>("/api/jobs?overdue=true&size=10"),
      ]);
      setReminders(remRes);
      setJobs(jobsRes.items);
      setOverdueJobs(overdueRes.items);
      setStats({
        totalClients: clientsRes.total,
        pendingJobs: jobsRes.total,
        upcomingReminders: remRes.length,
        overdueJobs: overdueRes.total,
      });
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchData();
  }, [supabase.auth, fetchData]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Usuario";

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header with quick actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Hola, {user ? displayName : "..."}</h1>
          <p className="text-sm text-muted-foreground">Resumen de tu sistema</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/clients/new"
            className={buttonVariants({ variant: "outline", size: "sm", className: "h-10 sm:h-8" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Cliente
          </Link>
          <Link
            href="/dashboard/jobs/new"
            className={buttonVariants({ variant: "outline", size: "sm", className: "h-10 sm:h-8" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Trabajo
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div
            className="rounded-lg border border-border/60 p-3.5 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => router.push("/dashboard/clients")}
          >
            <p className="text-xs text-muted-foreground">Clientes</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1">{stats.totalClients}</p>
          </div>
          <div
            className="rounded-lg border border-border/60 p-3.5 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => router.push("/dashboard/jobs")}
          >
            <p className="text-xs text-muted-foreground">Trabajos programados</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1">{stats.pendingJobs}</p>
          </div>
          <div
            className="rounded-lg border border-border/60 p-3.5 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => router.push("/dashboard/reminders")}
          >
            <p className="text-xs text-muted-foreground">Recordatorios (7d)</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1">{stats.upcomingReminders}</p>
          </div>
          {stats.overdueJobs > 0 && (
            <div className="rounded-lg border border-border/60 p-3.5">
              <p className="text-xs text-muted-foreground">Vencidos</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1 text-[var(--status-overdue)]">
                {stats.overdueJobs}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overdue jobs */}
      {overdueJobs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2">
              Trabajos vencidos
              <span className="text-xs text-muted-foreground tabular-nums">({overdueJobs.length})</span>
            </h2>
            <Link
              href="/dashboard/jobs"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {overdueJobs.map((j) => (
              <div
                key={j.id}
                className="flex items-center gap-3 py-2.5"
              >
                <AlertTriangle className="h-4 w-4 text-[var(--status-overdue)] shrink-0" />
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => router.push(`/dashboard/jobs/${j.id}`)}
                >
                  <p className="text-sm font-medium truncate">
                    {j.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {j.scheduled_date} — {JOB_TYPE_LABELS[j.job_type] ?? j.job_type}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => setCompleteJob(j)}
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Completar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => setRescheduleJob(j)}
                  >
                    <CalendarClock className="mr-1 h-3 w-3" />
                    Reprogramar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Upcoming reminders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2>Recordatorios proximos</h2>
            <Link
              href="/dashboard/reminders"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Sin recordatorios en los proximos 7 dias</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {reminders.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {r.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.remind_date}
                    </p>
                  </div>
                  <StatusIndicator
                    status={r.status}
                    label={REMINDER_STATUS_LABELS[r.status] ?? r.status}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled jobs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2>Trabajos programados</h2>
            <Link
              href="/dashboard/jobs"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No hay trabajos programados</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {jobs.map((j) => (
                <div
                  key={j.id}
                  className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                  onClick={() => router.push(`/dashboard/jobs/${j.id}`)}
                >
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {j.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {j.scheduled_date} — {JOB_TYPE_LABELS[j.job_type] ?? j.job_type}
                    </p>
                  </div>
                  <StatusIndicator
                    status={j.status}
                    label={JOB_STATUS_LABELS[j.status] ?? j.status}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {completeJob && (
        <CompleteJobDialog
          open={!!completeJob}
          onOpenChange={(open) => !open && setCompleteJob(null)}
          job={completeJob}
          onCompleted={fetchData}
        />
      )}
      {rescheduleJob && (
        <RescheduleJobDialog
          open={!!rescheduleJob}
          onOpenChange={(open) => !open && setRescheduleJob(null)}
          job={rescheduleJob}
          onRescheduled={fetchData}
        />
      )}
    </div>
  );
}
