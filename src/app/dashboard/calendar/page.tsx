"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { api } from "@/lib/api";
import type { CalendarResponse, CalendarEvent } from "@/lib/types";
import { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "@/lib/types";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

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

function formatRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
}

function getCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-6 w-40" />
      <div className="flex items-center justify-between">
        <div className="skeleton h-8 w-8 rounded-md" />
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-8 w-8 rounded-md" />
      </div>
      <div className="grid grid-cols-7 gap-px rounded-lg border overflow-hidden">
        {[...Array(35)].map((_, i) => (
          <div key={i} className="skeleton min-h-16 rounded-none" />
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = formatRange(year, month);
      const res = await api.get<CalendarResponse>(
        `/api/calendar?start=${start}&end=${end}`
      );
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchCalendar();
    setSelectedDay(null);
  }, [fetchCalendar]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  const eventsMap = new Map<string, CalendarEvent[]>();
  if (data) {
    for (const day of data.days) {
      if (day.events.length > 0) {
        eventsMap.set(day.date, day.events);
      }
    }
  }

  const grid = getCalendarGrid(year, month);
  const todayStr = now.toISOString().split("T")[0];
  const selectedEvents = selectedDay ? eventsMap.get(selectedDay) ?? [] : [];

  function handleEventClick(event: CalendarEvent) {
    if (event.type === "job") {
      router.push(`/dashboard/jobs/${event.id}`);
    }
  }

  if (loading) return <CalendarSkeleton />;

  return (
    <div className="space-y-4">
      <h1>Calendario</h1>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {MONTHS_ES[month]} {year}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Calendar grid */}
        <div className="flex-1">
          <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground mb-1">
            {DAYS_ES.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px rounded-lg border border-border/60 bg-border/60 overflow-hidden">
            {grid.map((day, i) => {
              if (day === null) {
                return (
                  <div key={`empty-${i}`} className="bg-muted/30 min-h-16" />
                );
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const events = eventsMap.get(dateStr) ?? [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDay;
              const jobCount = events.filter(
                (e) => e.type === "job"
              ).length;
              const reminderCount = events.filter(
                (e) => e.type === "reminder"
              ).length;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDay(dateStr)}
                  className={`bg-card min-h-16 p-1 text-left transition-colors hover:bg-muted/50 ${
                    isSelected ? "bg-muted/50" : ""
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      isToday
                        ? "bg-foreground text-background font-bold"
                        : ""
                    }`}
                  >
                    {day}
                  </span>
                  {events.length > 0 && (
                    <div className="mt-0.5 flex gap-1 px-0.5">
                      {jobCount > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-scheduled)]" />
                      )}
                      {reminderCount > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-pending)]" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {data && (
            <p className="mt-2 text-xs text-muted-foreground tabular-nums">
              {data.total_events} evento{data.total_events !== 1 ? "s" : ""}{" "}
              este mes
            </p>
          )}
        </div>

        {/* Selected day detail */}
        <div className="w-full lg:w-72 space-y-2">
          {selectedDay ? (
            <>
              <p className="text-xs font-medium text-muted-foreground">{selectedDay}</p>
              {selectedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <Calendar className="h-6 w-6 mb-1.5 opacity-40" />
                  <p className="text-sm">Sin eventos</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {selectedEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-center gap-2.5 py-2.5 ${
                        event.type === "job"
                          ? "cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                          : ""
                      }`}
                      onClick={() => handleEventClick(event)}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          event.type === "job"
                            ? "bg-[var(--status-scheduled)]"
                            : "bg-[var(--status-pending)]"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
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
                      <StatusIndicator
                        status={event.status}
                        label={
                          JOB_STATUS_LABELS[
                            event.status as keyof typeof JOB_STATUS_LABELS
                          ] ?? event.status
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Selecciona un dia para ver sus eventos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
