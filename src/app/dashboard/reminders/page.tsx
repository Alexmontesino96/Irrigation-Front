"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pagination } from "@/components/shared/pagination";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ReminderFormDialog } from "@/components/reminders/reminder-form-dialog";
import { api, FetchError } from "@/lib/api";
import type { Reminder, PaginatedResponse } from "@/lib/types";
import { REMINDER_STATUS_LABELS } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Plus, Clock, CheckCircle, XCircle, Bot, User, Search } from "lucide-react";

const PAGE_SIZE = 15;

const STATUS_ICON: Record<string, typeof Clock> = {
  pending: Clock,
  completed: CheckCircle,
  cancelled: XCircle,
};

export default function RemindersPage() {
  const [tab, setTab] = useState("upcoming");
  const [upcoming, setUpcoming] = useState<Reminder[]>([]);
  const [allData, setAllData] = useState<PaginatedResponse<Reminder> | null>(
    null
  );
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<{
    reminder: Reminder;
    action: "complete" | "cancel";
  } | null>(null);

  // Fetch upcoming
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

  // Fetch all
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get<PaginatedResponse<Reminder>>(
        `/api/reminders?${params}`
      );
      setAllData(res);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (tab === "upcoming") fetchUpcoming();
    else fetchAll();
  }, [tab, fetchUpcoming, fetchAll]);

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

  const selectClass =
    "flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  function ReminderCard({ reminder }: { reminder: Reminder }) {
    const Icon = STATUS_ICON[reminder.status] ?? Clock;
    const isPending = reminder.status === "pending";

    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-3">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{reminder.title}</p>
              <span title={reminder.is_auto_generated ? "Auto-generado" : "Manual"}>
                {reminder.is_auto_generated ? (
                  <Bot className="h-3 w-3 text-muted-foreground shrink-0" />
                ) : (
                  <User className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {reminder.remind_date}
              {reminder.description && ` — ${reminder.description}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={
                reminder.status === "completed"
                  ? "default"
                  : reminder.status === "cancelled"
                    ? "destructive"
                    : "secondary"
              }
            >
              {REMINDER_STATUS_LABELS[reminder.status] ?? reminder.status}
            </Badge>
            {isPending && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Completar"
                  onClick={() =>
                    setActionTarget({ reminder, action: "complete" })
                  }
                >
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Cancelar"
                  onClick={() =>
                    setActionTarget({ reminder, action: "cancel" })
                  }
                >
                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>Recordatorios</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
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
              <label className="text-sm text-muted-foreground">
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
              <p className="text-muted-foreground">Cargando...</p>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay recordatorios proximos.
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((r) => (
                  <ReminderCard key={r.id} reminder={r} />
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
                  setPage(1);
                }}
                className="flex-1 min-w-[200px] max-w-sm"
              >
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por titulo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </form>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className={selectClass}
              >
                <option value="">Todos los estados</option>
                {Object.entries(REMINDER_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : allData && allData.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No se encontraron recordatorios.
              </p>
            ) : allData ? (
              <>
                <div className="space-y-2">
                  {allData.items.map((r) => (
                    <ReminderCard key={r.id} reminder={r} />
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
