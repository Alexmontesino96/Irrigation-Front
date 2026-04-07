"use client";

import { useMemo } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import type { CalendarDay, CalendarEvent } from "@/lib/types";

interface MiniCalendarProps {
  year: number;
  month: number; // 0-indexed
  calendarDays: CalendarDay[];
  todayEvents: CalendarEvent[];
}

const DAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Returns 0=Monday ... 6=Sunday (ISO week, Monday-first)
function getFirstDayOfWeek(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay(); // 0=Sun ... 6=Sat
  return (jsDay + 6) % 7;
}

export function MiniCalendar({ year, month, calendarDays, todayEvents }: MiniCalendarProps) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Build a set of dates that have events for quick lookup
  const eventDates = useMemo(() => {
    const s = new Set<string>();
    calendarDays.forEach((d) => {
      if (d.events.length > 0) s.add(d.date);
    });
    return s;
  }, [calendarDays]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstWeekday = getFirstDayOfWeek(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  // Build grid: always 6 rows x 7 cols = 42 cells
  type Cell = { day: number; current: boolean; dateStr: string };
  const cells: Cell[] = [];

  // Previous month tail
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, current: false, dateStr });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, current: true, dateStr });
  }

  // Next month head
  let nextDay = 1;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  while (cells.length < 42) {
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
    cells.push({ day: nextDay, current: false, dateStr });
    nextDay++;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Calendario</h2>
        <span className="text-sm text-muted-foreground">
          {MONTH_NAMES[month]} {year}
        </span>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-px">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] font-medium text-muted-foreground py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;
          const hasEvent = eventDates.has(cell.dateStr);
          return (
            <div
              key={idx}
              className="flex flex-col items-center justify-center py-0.5"
            >
              <div
                className={[
                  "h-7 w-7 flex items-center justify-center rounded-full text-xs transition-colors",
                  isToday
                    ? "bg-primary text-primary-foreground font-bold"
                    : cell.current
                    ? "text-foreground hover:bg-muted"
                    : "text-muted-foreground/50",
                ].join(" ")}
              >
                {cell.day}
              </div>
              {hasEvent && (
                <div
                  className={[
                    "h-1 w-1 rounded-full mt-0.5",
                    isToday ? "bg-primary-foreground" : "bg-primary",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Today's events */}
      {todayEvents.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border/60">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Hoy
          </p>
          {todayEvents.slice(0, 4).map((ev) => (
            <div key={ev.id} className="flex items-start gap-2">
              {ev.type === "reminder" ? (
                <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
              )}
              <span className="text-xs text-foreground truncate leading-snug">
                {ev.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {todayEvents.length === 0 && (
        <div className="pt-2 border-t border-border/60">
          <p className="text-xs text-muted-foreground text-center py-1">
            Sin eventos hoy
          </p>
        </div>
      )}
    </div>
  );
}
