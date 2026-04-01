"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Users,
  Briefcase,
  Bell,
  CalendarDays,
  Plus,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  CalendarClock,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Stats {
  totalClients: number;
  pendingJobs: number;
  upcomingReminders: number;
  overdueJobs: number;
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

  return (
    <div className="space-y-6">
      <div>
        <h1>Hola, {user ? displayName : "..."}</h1>
        <p className="text-muted-foreground">Resumen de tu sistema</p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/clients/new"
          className={buttonVariants({ variant: "outline", size: "sm", className: "h-12 text-base sm:h-8 sm:text-sm" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo cliente
        </Link>
        <Link
          href="/dashboard/jobs/new"
          className={buttonVariants({ variant: "outline", size: "sm", className: "h-12 text-base sm:h-8 sm:text-sm" })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo trabajo
        </Link>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card
            className="cursor-pointer hover:bg-accent/50"
            onClick={() => router.push("/dashboard/clients")}
          >
            <CardContent className="flex items-center gap-4 p-3 md:p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">{stats.totalClients}</p>
                <p className="text-xs font-medium text-muted-foreground">Clientes</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:bg-accent/50"
            onClick={() => router.push("/dashboard/jobs")}
          >
            <CardContent className="flex items-center gap-4 p-3 md:p-4">
              <div className="rounded-lg bg-chart-2/15 p-2">
                <Briefcase className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">{stats.pendingJobs}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  Trabajos programados
                </p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:bg-accent/50"
            onClick={() => router.push("/dashboard/reminders")}
          >
            <CardContent className="flex items-center gap-4 p-3 md:p-4">
              <div className="rounded-lg bg-chart-3/15 p-2">
                <Bell className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">
                  {stats.upcomingReminders}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  Recordatorios (7 dias)
                </p>
              </div>
            </CardContent>
          </Card>
          {stats.overdueJobs > 0 && (
            <Card className="border-destructive/50">
              <CardContent className="flex items-center gap-4 p-3 md:p-4">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight text-destructive">
                    {stats.overdueJobs}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    Trabajos vencidos
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <div className="space-y-6">
          {/* Overdue jobs section */}
          {overdueJobs.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    Trabajos vencidos
                  </CardTitle>
                  <Badge variant="destructive" className="text-[10px]">
                    {overdueJobs.length}
                  </Badge>
                </div>
                <Link
                  href="/dashboard/jobs"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueJobs.map((j) => (
                    <div
                      key={j.id}
                      className="flex items-center gap-3 rounded-md border border-destructive/30 p-2"
                    >
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
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
                          variant="outline"
                          size="sm"
                          className="h-9 text-xs md:h-7"
                          onClick={() => setCompleteJob(j)}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 text-xs md:h-7"
                          onClick={() => setRescheduleJob(j)}
                        >
                          <CalendarClock className="mr-1 h-3 w-3" />
                          Reprogramar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upcoming reminders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">
                  Recordatorios proximos
                </CardTitle>
                <Link
                  href="/dashboard/reminders"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {reminders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin recordatorios en los proximos 7 dias.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {reminders.slice(0, 5).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 rounded-md border p-2"
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
                        <Badge variant="secondary" className="text-[10px]">
                          {REMINDER_STATUS_LABELS[r.status] ?? r.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scheduled jobs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">
                  Trabajos programados
                </CardTitle>
                <Link
                  href="/dashboard/jobs"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay trabajos programados.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {jobs.map((j) => (
                      <div
                        key={j.id}
                        className="flex items-center gap-3 rounded-md border p-2 cursor-pointer hover:bg-accent/50"
                        onClick={() => router.push(`/dashboard/jobs/${j.id}`)}
                      >
                        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {j.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {j.scheduled_date} —{" "}
                            {JOB_TYPE_LABELS[j.job_type] ?? j.job_type}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {JOB_STATUS_LABELS[j.status] ?? j.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

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
