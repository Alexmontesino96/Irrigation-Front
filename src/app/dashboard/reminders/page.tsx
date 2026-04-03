"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pagination } from "@/components/shared/pagination";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ReminderFormDialog } from "@/components/reminders/reminder-form-dialog";
import { useListParams } from "@/lib/use-list-params";
import { api, FetchError } from "@/lib/api";
import type { Reminder, PaginatedResponse } from "@/lib/types";
import { REMINDER_STATUS_LABELS } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Plus, CheckCircle, XCircle, Bot, User, Search, Inbox } from "lucide-react";

const PAGE_SIZE = 15;

const SORT_OPTIONS = [
  { label: "Fecha \u2191", sort_by: "remind_date", sort_order: "asc" as const },
  { label: "Fecha \u2193", sort_by: "remind_date", sort_order: "desc" as const },
  { label: "Mas nuevos", sort_by: "created_at", sort_order: "desc" as const },
  { label: "Titulo A-Z", sort_by: "title", sort_order: "asc" as const },
];

function RemindersSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-border/40">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="py-3">
          <div className="skeleton h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

function RemindersContent() {
  const [tab, setTab] = useState("upcoming");
  const [upcoming, setUpcoming] = useState<Reminder[]>([]);
  const [allData, setAllData] = useState<PaginatedResponse<Reminder> | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<{
    reminder: Reminder;
    action: "complete" | "cancel";
  } | null>(null);

  const {
    page,
    search,
    sortBy,
    sortOrder,
    filters,
    setPage,
    setSearch,
    setSortDirect,
    setFilter,
    buildApiParams,
  } = useListParams({
    defaultSortBy: "remind_date",
    defaultSortOrder: "asc",
    defaultPageSize: PAGE_SIZE,
    filterKeys: ["status"],
  });

  const [searchInput, setSearchInput] = useState(search);

  const fetchUpcoming = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Reminder[]>(
        `/api/reminders/upcoming?days=${days}`
      );
      setUpcoming(res);
    } finally {
      setLoading(false);
    }
  }, [days]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Reminder>>(
        `/api/reminders?${buildApiParams()}`
      );
      setAllData(res);
    } finally {
      setLoading(false);
    }
  }, [buildApiParams]);

  useEffect(() => {
    if (tab === "upcoming") fetchUpcoming();
    else fetchAll();
  }, [tab, fetchUpcoming, fetchAll]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  async function handleAction() {
    if (!actionTarget) return;
    const { reminder, action } = actionTarget;
    try {
      await api.patch(`/api/reminders/${reminder.id}`, {
        status: action === "complete" ? "completed" : "cancelled",
      });
      setActionTarget(null);
      if (tab === "upcoming") fetchUpcoming();
      else fetchAll();
    } catch (err) {
      if (err instanceof FetchError) alert(err.detail);
    }
  }

  function handleSaved() {
    if (tab === "upcoming") fetchUpcoming();
    else fetchAll();
  }

  const currentSortKey = `${sortBy}:${sortOrder}`;

  function handleSortChange(value: string) {
    const opt = SORT_OPTIONS.find((o) => `${o.sort_by}:${o.sort_order}` === value);
    if (!opt) return;
    setSortDirect(opt.sort_by, opt.sort_order);
  }

  const selectClass =
    "flex h-8 rounded-lg border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  function ReminderRow({ reminder }: { reminder: Reminder }) {
    const isPending = reminder.status === "pending";

    return (
      <div className="flex items-center gap-3 py-2.5">
        <StatusIndicator
          status={reminder.status}
          label=""
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{reminder.title}</p>
            <span title={reminder.is_auto_generated ? "Auto-generado" : "Manual"}>
              {reminder.is_auto_generated ? (
                <Bot className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              ) : (
                <User className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              )}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {reminder.remind_date}
            {reminder.description && ` — ${reminder.description}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusIndicator
            status={reminder.status}
            label={REMINDER_STATUS_LABELS[reminder.status] ?? reminder.status}
          />
          {isPending && (
            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                title="Completar"
                onClick={() =>
                  setActionTarget({ reminder, action: "complete" })
                }
              >
                <CheckCircle className="h-3.5 w-3.5 text-[var(--status-completed)]" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                title="Cancelar"
                onClick={() =>
                  setActionTarget({ reminder, action: "cancel" })
                }
              >
                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Recordatorios</h1>
        <Button size="sm" className="h-10 md:h-8" onClick={() => setFormOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nuevo
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Proximos</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <label className="text-xs text-muted-foreground">
                Proximos
              </label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className={selectClass}
              >
                <option value={7}>7 dias</option>
                <option value={14}>14 dias</option>
                <option value={30}>30 dias</option>
                <option value={60}>60 dias</option>
                <option value={90}>90 dias</option>
              </select>
            </div>

            {loading ? (
              <RemindersSkeleton />
            ) : upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No hay recordatorios proximos</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {upcoming.map((r) => (
                  <ReminderRow key={r.id} reminder={r} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearch(searchInput);
                }}
                className="flex-1 min-w-[200px] max-w-sm"
              >
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por titulo..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </form>
              <select
                value={filters.status || ""}
                onChange={(e) => setFilter("status", e.target.value || null)}
                className={selectClass}
              >
                <option value="">Todos los estados</option>
                {Object.entries(REMINDER_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <select
                value={currentSortKey}
                onChange={(e) => handleSortChange(e.target.value)}
                className={selectClass}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={`${opt.sort_by}:${opt.sort_order}`} value={`${opt.sort_by}:${opt.sort_order}`}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <RemindersSkeleton />
            ) : allData && allData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No se encontraron recordatorios</p>
              </div>
            ) : allData ? (
              <>
                <div className="divide-y divide-border/40">
                  {allData.items.map((r) => (
                    <ReminderRow key={r.id} reminder={r} />
                  ))}
                </div>
                <Pagination
                  page={allData.page}
                  pages={allData.pages}
                  total={allData.total}
                  onPageChange={setPage}
                />
              </>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      <ReminderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!actionTarget}
        onOpenChange={(open) => !open && setActionTarget(null)}
        title={
          actionTarget?.action === "complete"
            ? "Completar recordatorio"
            : "Cancelar recordatorio"
        }
        description={`¿Marcar "${actionTarget?.reminder.title}" como ${actionTarget?.action === "complete" ? "completado" : "cancelado"}?`}
        confirmLabel={
          actionTarget?.action === "complete" ? "Completar" : "Cancelar"
        }
        onConfirm={handleAction}
        destructive={actionTarget?.action === "cancel"}
      />
    </div>
  );
}

export default function RemindersPage() {
  return (
    <Suspense fallback={<RemindersSkeleton />}>
      <RemindersContent />
    </Suspense>
  );
}
