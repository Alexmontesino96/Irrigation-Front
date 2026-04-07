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
import { MiniCalendar } from "@/components/dashboard/mini-calendar";
import { api } from "@/lib/api";
import type {
  Reminder,
  Job,
  PaginatedResponse,
  FinancialSummary,
  MonthlyData,
  CalendarResponse,
  CalendarEvent,
} from "@/lib/types";
import {
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
} from "@/lib/types";
import {
  Plus,
  ArrowRight,
  CheckCircle,
  CalendarClock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Inbox,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

// ── Skeleton ────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-6 w-44" />
          <div className="skeleton h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-8 w-24 rounded-md" />
          <div className="skeleton h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Hero stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>

      {/* Chart + Calendar skeleton */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="skeleton h-64 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="skeleton h-48 rounded-xl" />
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────

const JOB_STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  scheduled:   { bg: "bg-green-100 dark:bg-green-900/30",  text: "text-green-700 dark:text-green-400" },
  in_progress: { bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-700 dark:text-amber-400" },
  pending:     { bg: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-700 dark:text-blue-400" },
  completed:   { bg: "bg-gray-100 dark:bg-gray-800",       text: "text-gray-600 dark:text-gray-400" },
  cancelled:   { bg: "bg-red-100 dark:bg-red-900/30",      text: "text-red-700 dark:text-red-400" },
};

function JobStatusBadge({ status }: { status: string }) {
  const style = JOB_STATUS_BADGE[status] ?? { bg: "bg-muted", text: "text-muted-foreground" };
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
      ].join(" ")}
    >
      {JOB_STATUS_LABELS[status as keyof typeof JOB_STATUS_LABELS] ?? status}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [financial, setFinancial] = useState<FinancialSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [scheduledJobs, setScheduledJobs] = useState<Job[]>([]);
  const [todayJobs, setTodayJobs] = useState<Job[]>([]);
  const [overdueJobs, setOverdueJobs] = useState<Job[]>([]);
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);

  // Dialog states
  const [completeJob, setCompleteJob] = useState<Job | null>(null);
  const [rescheduleJob, setRescheduleJob] = useState<Job | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    try {
      const [finRes, monthRes, scheduledRes, overdueRes, calRes] = await Promise.all([
        api.get<FinancialSummary>("/api/analytics/financial-summary").catch(() => null),
        api.get<MonthlyData[]>("/api/analytics/monthly-revenue?months=6").catch(() => [] as MonthlyData[]),
        api.get<PaginatedResponse<Job>>("/api/jobs?status=scheduled&size=10").catch(() => ({ items: [], total: 0, page: 1, size: 10, pages: 0 } as PaginatedResponse<Job>)),
        api.get<PaginatedResponse<Job>>("/api/jobs?overdue=true&size=10").catch(() => ({ items: [], total: 0, page: 1, size: 10, pages: 0 } as PaginatedResponse<Job>)),
        api.get<CalendarResponse>(
          `/api/calendar?start=${monthStart}&end=${monthEnd}`
        ).catch(() => null),
      ]);

      if (finRes) setFinancial(finRes);
      if (monthRes) setMonthlyData(monthRes);
      setScheduledJobs(scheduledRes.items);
      setOverdueJobs(overdueRes.items);

      if (calRes) {
        setCalendarData(calRes);
        const todayDay = calRes.days.find((d) => d.date === todayStr);
        setTodayEvents(todayDay?.events ?? []);
      }

      // Filter today's jobs from scheduled list
      const todays = scheduledRes.items.filter((j) => j.scheduled_date === todayStr);
      setTodayJobs(todays);
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

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const revenueChangePositive = (financial?.revenue_change_pct ?? 0) >= 0;

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
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

      {/* ── Row 1: Hero stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* Card 1 — Ingresos del mes (green gradient) */}
        <div
          className="rounded-xl p-5 shadow-sm cursor-pointer"
          style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" }}
          onClick={() => router.push("/dashboard/invoices")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && router.push("/dashboard/invoices")}
          aria-label="Ver facturas"
        >
          <p className="text-sm font-medium text-white/80">Ingresos del mes</p>
          <p className="mt-1 text-4xl font-bold text-white tabular-nums tracking-tight">
            ${(financial?.revenue_this_month ?? 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}
          </p>
          {financial && financial.revenue_change_pct !== 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-white/90">
              {revenueChangePositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>
                {revenueChangePositive ? "+" : ""}
                {financial.revenue_change_pct.toFixed(1)}% vs mes anterior
              </span>
            </div>
          )}
        </div>

        {/* Card 2 — Trabajos completados (blue gradient) */}
        <div
          className="rounded-xl p-5 shadow-sm"
          style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
        >
          <p className="text-sm font-medium text-white/80">Trabajos completados</p>
          <p className="mt-1 text-4xl font-bold text-white tabular-nums tracking-tight">
            {financial?.jobs_completed ?? 0}
          </p>
          <p className="mt-2 text-xs text-white/70">este mes</p>
        </div>

        {/* Card 3 — Trabajos proximos (teal gradient) */}
        <div
          className="rounded-xl p-5 shadow-sm cursor-pointer"
          style={{ background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)" }}
          onClick={() => router.push("/dashboard/jobs")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && router.push("/dashboard/jobs")}
          aria-label="Ver trabajos programados"
        >
          <p className="text-sm font-medium text-white/80">Trabajos proximos</p>
          <p className="mt-1 text-4xl font-bold text-white tabular-nums tracking-tight">
            {scheduledJobs.length}
          </p>
          <p className="mt-2 text-xs text-white/70">programados</p>
        </div>
      </div>

      {/* ── Row 2: Chart + Calendar ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">

        {/* Left: Revenue chart */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Resumen de Ingresos</h2>
            <span className="text-xs text-muted-foreground">ultimos 6 meses</span>
          </div>
          {monthlyData.length > 0 ? (
            <BarChart
              data={monthlyData.map((m) => {
                // Convert "YYYY-MM" to short Spanish month label
                const [yr, mo] = m.month.split("-");
                const shortMonth = new Date(Number(yr), Number(mo) - 1, 1)
                  .toLocaleString("es-MX", { month: "short" });
                return {
                  label: shortMonth.charAt(0).toUpperCase() + shortMonth.slice(1).replace(".", ""),
                  values: [
                    { value: m.revenue, color: "#22c55e", label: "Ingresos" },
                    { value: m.expenses, color: "#3b82f6", label: "Gastos" },
                  ],
                };
              })}
              height={180}
            />
          ) : (
            <div className="flex h-44 flex-col items-center justify-center text-muted-foreground">
              <Inbox className="mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">Sin datos de ingresos</p>
            </div>
          )}
        </div>

        {/* Right: Mini calendar */}
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <MiniCalendar
            year={currentYear}
            month={currentMonth}
            calendarDays={calendarData?.days ?? []}
            todayEvents={todayEvents}
          />
        </div>
      </div>

      {/* ── Row 3: Trabajos de hoy ──────────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Trabajos de hoy</h2>
          <Link
            href="/dashboard/jobs"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {todayJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Inbox className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm">Sin trabajos para hoy</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="pb-2 text-left text-xs font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="pb-2 text-left text-xs font-medium text-muted-foreground">
                    Servicio
                  </th>
                  <th className="pb-2 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Fecha
                  </th>
                  <th className="pb-2 text-left text-xs font-medium text-muted-foreground">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {todayJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                  >
                    <td className="py-2.5 pr-3">
                      <p className="text-sm font-medium truncate max-w-[120px]">
                        {job.client_name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {job.property_name ?? ""}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <p className="text-sm truncate max-w-[150px]">{job.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3 hidden sm:table-cell">
                      <p className="text-sm tabular-nums">{job.scheduled_date}</p>
                    </td>
                    <td className="py-2.5">
                      <JobStatusBadge status={job.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Overdue jobs ────────────────────────────────────────────────── */}
      {overdueJobs.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-5 dark:border-orange-900/40 dark:bg-orange-950/20">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-orange-800 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              Trabajos vencidos
              <span className="text-sm font-normal text-orange-600 dark:text-orange-500">
                ({overdueJobs.length})
              </span>
            </h2>
            <Link
              href="/dashboard/jobs"
              className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 dark:text-orange-500 dark:hover:text-orange-300"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-orange-200/60 dark:divide-orange-900/40">
            {overdueJobs.map((j) => (
              <div key={j.id} className="flex items-center gap-3 py-2.5">
                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => router.push(`/dashboard/jobs/${j.id}`)}
                >
                  <p className="text-sm font-medium truncate">{j.title}</p>
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

      {/* ── Trabajos programados proximos (full list fallback) ──────────── */}
      {scheduledJobs.length > 0 && todayJobs.length === scheduledJobs.length && (
        // All scheduled jobs are today — nothing extra to show
        null
      )}

      {scheduledJobs.filter((j) => j.scheduled_date !== now.toISOString().split("T")[0]).length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Proximos trabajos</h2>
            <Link
              href="/dashboard/jobs"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {scheduledJobs
              .filter((j) => j.scheduled_date !== now.toISOString().split("T")[0])
              .slice(0, 5)
              .map((j) => (
                <div
                  key={j.id}
                  className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-muted/40 -mx-2 px-2 rounded-md transition-colors"
                  onClick={() => router.push(`/dashboard/jobs/${j.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{j.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {j.scheduled_date} — {j.client_name ?? ""}{j.client_name && j.property_name ? " · " : ""}{j.property_name ?? ""}
                    </p>
                  </div>
                  <StatusIndicator
                    status={j.status}
                    label={JOB_STATUS_LABELS[j.status] ?? j.status}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Dialogs ────────────────────────────────────────────────────── */}
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
