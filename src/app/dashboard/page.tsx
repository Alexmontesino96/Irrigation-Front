"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { CompleteJobDialog } from "@/components/jobs/complete-job-dialog";
import { RescheduleJobDialog } from "@/components/jobs/reschedule-job-dialog";
import { BarChart } from "@/components/dashboard/bar-chart";
import { api } from "@/lib/api";
import type {
  Reminder,
  Job,
  Client,
  PaginatedResponse,
  FinancialSummary,
  MonthlyData,
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
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

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
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [overdueJobs, setOverdueJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeJob, setCompleteJob] = useState<Job | null>(null);
  const [rescheduleJob, setRescheduleJob] = useState<Job | null>(null);
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      const [remRes, jobsRes, overdueRes, finRes, monthRes] = await Promise.all([
        api.get<Reminder[]>("/api/reminders/upcoming?days=7"),
        api.get<PaginatedResponse<Job>>(
          "/api/jobs?status=scheduled&size=5"
        ),
        api.get<PaginatedResponse<Job>>("/api/jobs?overdue=true&size=10"),
        api.get<FinancialSummary>("/api/analytics/financial-summary").catch(() => null),
        api.get<MonthlyData[]>("/api/analytics/monthly-revenue?months=6").catch(() => []),
      ]);
      setReminders(remRes);
      setJobs(jobsRes.items);
      setOverdueJobs(overdueRes.items);
      if (finRes) setFinancial(finRes);
      if (monthRes) setMonthlyData(monthRes);
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

      {/* Financial Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div
          className="rounded-lg border border-border/60 p-3.5 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/dashboard/invoices")}
        >
          <p className="text-xs text-muted-foreground">Ingresos del mes</p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1">
            ${financial?.revenue_this_month?.toFixed(0) ?? "0"}
          </p>
          {financial && financial.revenue_change_pct !== 0 && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${financial.revenue_change_pct > 0 ? "text-green-600" : "text-red-500"}`}>
              {financial.revenue_change_pct > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {financial.revenue_change_pct > 0 ? "+" : ""}
              {financial.revenue_change_pct.toFixed(1)}%
            </div>
          )}
        </div>
        <div
          className="rounded-lg border border-border/60 p-3.5 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/dashboard/expenses")}
        >
          <p className="text-xs text-muted-foreground">Gastos del mes</p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1">
            ${financial?.expenses_this_month?.toFixed(0) ?? "0"}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 p-3.5">
          <p className="text-xs text-muted-foreground">Margen</p>
          <p className={`text-2xl font-semibold tabular-nums tracking-tight mt-1 ${(financial?.profit_margin ?? 0) >= 0 ? "" : "text-red-500"}`}>
            ${financial?.profit_margin?.toFixed(0) ?? "0"}
          </p>
        </div>
        <div
          className="rounded-lg border border-border/60 p-3.5 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => router.push("/dashboard/invoices?status=sent")}
        >
          <p className="text-xs text-muted-foreground">Por cobrar</p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1">
            ${financial?.outstanding?.toFixed(0) ?? "0"}
          </p>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      {monthlyData.length > 0 && (
        <div className="rounded-lg border border-border/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
            Ingresos vs Gastos (6 meses)
          </p>
          <BarChart
            data={monthlyData.map((m) => ({
              label: m.month.slice(5),
              values: [
                { value: m.revenue, color: "var(--status-completed, #22c55e)", label: "Ingresos" },
                { value: m.expenses, color: "var(--status-overdue, #ef4444)", label: "Gastos" },
              ],
            }))}
            height={160}
          />
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
