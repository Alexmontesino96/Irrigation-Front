"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { CalendarResponse, CalendarEvent, Reminder } from "@/lib/types";
import { JOB_TYPE_LABELS } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Wrench,
  Bell,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────

const DAYS_ES = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const DAYS_LONG_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
}

interface GridCell {
  day: number;
  dateStr: string;
  isCurrentMonth: boolean;
}

function getCalendarGrid(year: number, month: number): GridCell[] {
  const firstDay = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  // ISO week: Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: GridCell[] = [];

  // Days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateStr, isCurrentMonth: false });
  }

  // Days of current month
  for (let d = 1; d <= lastDayOfMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateStr, isCurrentMonth: true });
  }

  // Days from next month to fill grid
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
    cells.push({ day: nextDay, dateStr, isCurrentMonth: false });
    nextDay++;
  }

  return cells;
}

function getEventColors(event: CalendarEvent): string {
  if (event.type === "reminder") {
    return "bg-orange-50 text-orange-700 border-l-2 border-orange-400";
  }
  switch (event.job_type) {
    case "maintenance":
    case "repair":
      return "bg-blue-50 text-blue-700 border-l-2 border-blue-400";
    case "installation":
      return "bg-emerald-50 text-emerald-700 border-l-2 border-emerald-400";
    case "inspection":
      return "bg-amber-50 text-amber-700 border-l-2 border-amber-400";
    default:
      return "bg-slate-50 text-slate-600 border-l-2 border-slate-400";
  }
}

function formatSpanishDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dayName = DAYS_LONG_ES[d.getDay()];
  const dayNum = d.getDate();
  const monthName = MONTHS_ES[d.getMonth()];
  return `${dayName}, ${dayNum} de ${monthName}`;
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function CalendarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-muted rounded-md" />
        <div className="flex gap-2">
          <div className="h-8 w-32 bg-muted rounded-md" />
          <div className="h-8 w-16 bg-muted rounded-md" />
          <div className="h-8 w-20 bg-muted rounded-md" />
        </div>
      </div>
      <div className="flex gap-6">
        {/* Calendar skeleton */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <div className="h-8 w-8 bg-muted rounded-md" />
            <div className="h-5 w-36 bg-muted rounded-md" />
            <div className="h-8 w-8 bg-muted rounded-md" />
          </div>
          <div className="grid grid-cols-7 gap-px rounded-lg border overflow-hidden bg-border/60">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="bg-card min-h-[100px]" />
            ))}
          </div>
        </div>
        {/* Sidebar skeleton */}
        <div className="w-72 space-y-3">
          <div className="h-5 w-28 bg-muted rounded-md" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reminder sidebar section ────────────────────────────────────────────────────

interface ReminderSectionProps {
  title: string;
  reminders: Reminder[];
  dateLabel?: string;
  defaultOpen?: boolean;
}

function ReminderItem({ reminder }: { reminder: Reminder }) {
  const isPending =
    reminder.status === "pending" || reminder.status === "sent";
  const dotColor = isPending
    ? "bg-orange-400"
    : reminder.status === "completed"
      ? "bg-green-500"
      : "bg-slate-400";

  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-border/40 last:border-0">
      <span
        className={`mt-1 h-2 w-2 rounded-full shrink-0 ${dotColor}`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {reminder.title}
        </p>
        {reminder.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {reminder.description}
          </p>
        )}
      </div>
      <div className="flex gap-1 shrink-0 flex-col items-end">
        <button
          type="button"
          className="text-xs border border-border rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Archivar recordatorio"
        >
          Archivar
        </button>
      </div>
    </div>
  );
}

function ReminderItemWithActions({ reminder }: { reminder: Reminder }) {
  const isPending =
    reminder.status === "pending" || reminder.status === "sent";
  const dotColor = isPending
    ? "bg-orange-400"
    : reminder.status === "completed"
      ? "bg-green-500"
      : "bg-slate-400";

  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-border/40 last:border-0">
      <span
        className={`mt-1 h-2 w-2 rounded-full shrink-0 ${dotColor}`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {reminder.title}
        </p>
        {reminder.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {reminder.description}
          </p>
        )}
        <div className="flex gap-1 mt-1.5">
          <button
            type="button"
            className="text-xs border border-border rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Posponer recordatorio"
          >
            Posponer
          </button>
          <button
            type="button"
            className="text-xs border border-border rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Marcar como hecho"
          >
            Hecho
          </button>
        </div>
      </div>
    </div>
  );
}

function ReminderSection({
  title,
  reminders,
  dateLabel,
  defaultOpen = true,
}: ReminderSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (reminders.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-1.5 text-left group"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
          <span className="ml-1.5 text-muted-foreground font-normal">
            ({reminders.length})
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="mt-1">
          {dateLabel && (
            <p className="text-xs text-muted-foreground mb-1">{dateLabel}</p>
          )}
          {reminders.map((r) =>
            title === "Hoy" ? (
              <ReminderItem key={r.id} reminder={r} />
            ) : (
              <ReminderItemWithActions key={r.id} reminder={r} />
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── Proximos section grouped by date ──────────────────────────────────────────

function ProximosSection({ reminders }: { reminders: Reminder[] }) {
  const [open, setOpen] = useState(true);

  if (reminders.length === 0) return null;

  // Group by date
  const byDate = new Map<string, Reminder[]>();
  for (const r of reminders) {
    const existing = byDate.get(r.remind_date) ?? [];
    existing.push(r);
    byDate.set(r.remind_date, existing);
  }

  // Sort dates
  const sortedDates = Array.from(byDate.keys()).sort();

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-1.5 text-left group"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">
          Proximos
          <span className="ml-1.5 text-muted-foreground font-normal">
            ({reminders.length})
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="mt-1 space-y-3">
          {sortedDates.map((dateStr) => (
            <div key={dateStr}>
              <p className="text-xs font-medium text-foreground mb-1">
                {formatSpanishDate(dateStr)}
              </p>
              {(byDate.get(dateStr) ?? []).map((r) => (
                <ReminderItemWithActions key={r.id} reminder={r} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = formatRange(year, month);
      const [calData, reminderData] = await Promise.all([
        api.get<CalendarResponse>(`/api/calendar?start=${start}&end=${end}`),
        api.get<Reminder[]>("/api/reminders/upcoming?days=30"),
      ]);
      setData(calData);
      setReminders(reminderData);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchAll();
    setSelectedDay(null);
  }, [fetchAll]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToday() {
    const n = new Date();
    setYear(n.getFullYear());
    setMonth(n.getMonth());
  }

  // Build events map for O(1) lookup
  const eventsMap = new Map<string, CalendarEvent[]>();
  if (data) {
    for (const day of data.days) {
      if (day.events.length > 0) {
        eventsMap.set(day.date, day.events);
      }
    }
  }

  const grid = getCalendarGrid(year, month);
  const todayStr = getTodayStr();
  const tomorrowStr = getTomorrowStr();
  const selectedEvents = selectedDay ? (eventsMap.get(selectedDay) ?? []) : [];

  // Split reminders by section
  const todayReminders = reminders.filter((r) => r.remind_date === todayStr);
  const tomorrowReminders = reminders.filter(
    (r) => r.remind_date === tomorrowStr
  );
  const upcomingReminders = reminders.filter(
    (r) => r.remind_date !== todayStr && r.remind_date !== tomorrowStr
  );

  if (loading) return <CalendarSkeleton />;

  return (
    <div className="space-y-4">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-foreground">Calendario</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={goToday}
            aria-label="Ir al mes actual"
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="Selector de vista"
            aria-haspopup="listbox"
          >
            Mes
            <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
          </Button>
          <Link href="/dashboard/jobs/new">
            <Button size="sm" aria-label="Crear nuevo trabajo">
              + Nuevo Trabajo
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* ── Left: Calendar ── */}
        <div className="flex-1 min-w-0">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MONTHS_ES[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_ES.map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div
            className="grid grid-cols-7 gap-px rounded-lg border border-border/50 bg-border/40 overflow-hidden"
            role="grid"
            aria-label={`Calendario de ${MONTHS_ES[month]} ${year}`}
          >
            {grid.map((cell) => {
              const events = eventsMap.get(cell.dateStr) ?? [];
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDay;
              const visibleEvents = events.slice(0, 3);
              const overflowCount = events.length - visibleEvents.length;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  role="gridcell"
                  aria-label={`${cell.day} de ${MONTHS_ES[month]}, ${events.length} evento${events.length !== 1 ? "s" : ""}`}
                  aria-pressed={isSelected}
                  onClick={() =>
                    setSelectedDay(
                      cell.dateStr === selectedDay ? null : cell.dateStr
                    )
                  }
                  className={[
                    "bg-card min-h-[100px] p-1.5 text-left align-top transition-colors",
                    "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    !cell.isCurrentMonth && "bg-muted/20",
                    isSelected && "ring-2 ring-inset ring-primary",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {/* Day number */}
                  <span
                    className={[
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday
                        ? "bg-primary text-primary-foreground font-bold"
                        : cell.isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground/50",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {cell.day}
                  </span>

                  {/* Event pills */}
                  <div className="mt-1 space-y-0.5">
                    {visibleEvents.map((event) => (
                      <div
                        key={event.id}
                        className={[
                          "flex items-center gap-1 rounded px-1 py-0.5 text-xs truncate",
                          getEventColors(event),
                        ].join(" ")}
                        title={event.title}
                      >
                        {event.type === "job" ? (
                          <Wrench className="h-2.5 w-2.5 shrink-0" />
                        ) : (
                          <Bell className="h-2.5 w-2.5 shrink-0" />
                        )}
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                    {overflowCount > 0 && (
                      <p className="text-xs text-muted-foreground pl-1">
                        +{overflowCount} mas
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-blue-400" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">
                Mantenimiento / Reparacion
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-emerald-400" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">Instalacion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-amber-400" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">Inspeccion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-orange-400" aria-hidden="true" />
              <span className="text-xs text-muted-foreground">Recordatorio</span>
            </div>
          </div>

          {/* Selected day detail (mobile: shown below calendar) */}
          {selectedDay && (
            <div className="mt-4 rounded-lg border border-border p-3 lg:hidden">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {formatSpanishDate(selectedDay)}
              </p>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin eventos</p>
              ) : (
                <div className="divide-y divide-border/40">
                  {selectedEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className="flex w-full items-center gap-2.5 py-2.5 text-left hover:bg-muted/40 -mx-1 px-1 rounded transition-colors"
                      onClick={() => {
                        if (event.type === "job") {
                          router.push(`/dashboard/jobs/${event.job_id ?? event.id}`);
                        }
                      }}
                    >
                      <span
                        className={[
                          "h-2 w-2 rounded-full shrink-0",
                          event.type === "job"
                            ? "bg-blue-400"
                            : "bg-orange-400",
                        ].join(" ")}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.type === "job"
                            ? JOB_TYPE_LABELS[
                                event.job_type as keyof typeof JOB_TYPE_LABELS
                              ] ?? event.job_type
                            : "Recordatorio"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Reminders Sidebar ── */}
        <aside
          className="w-full lg:w-[300px] lg:shrink-0 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto"
          aria-label="Panel de recordatorios"
        >
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Recordatorios
          </h2>

          {todayReminders.length === 0 &&
          tomorrowReminders.length === 0 &&
          upcomingReminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30 mb-2" />
              <p className="text-sm">Sin recordatorios proximos</p>
            </div>
          ) : (
            <>
              <ReminderSection
                title="Hoy"
                reminders={todayReminders}
                defaultOpen={true}
              />
              <ReminderSection
                title="Manana"
                reminders={tomorrowReminders}
                defaultOpen={true}
              />
              <ProximosSection reminders={upcomingReminders} />
            </>
          )}

          {/* Selected day detail (desktop: shown in sidebar) */}
          {selectedDay && selectedEvents.length > 0 && (
            <div className="hidden lg:block mt-4 rounded-lg border border-border p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                {formatSpanishDate(selectedDay)}
              </p>
              <div className="divide-y divide-border/40">
                {selectedEvents.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className="flex w-full items-center gap-2.5 py-2.5 text-left hover:bg-muted/40 -mx-1 px-1 rounded transition-colors"
                    onClick={() => {
                      if (event.type === "job") {
                        router.push(
                          `/dashboard/jobs/${event.job_id ?? event.id}`
                        );
                      }
                    }}
                  >
                    <span
                      className={[
                        "h-2 w-2 rounded-full shrink-0",
                        event.type === "job" ? "bg-blue-400" : "bg-orange-400",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.type === "job"
                          ? JOB_TYPE_LABELS[
                              event.job_type as keyof typeof JOB_TYPE_LABELS
                            ] ?? event.job_type
                          : "Recordatorio"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
