"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pagination } from "@/components/shared/pagination";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { useListParams } from "@/lib/use-list-params";
import { api, FetchError } from "@/lib/api";
import type {
  SmsLog,
  Client,
  SmsTemplate,
  PaginatedResponse,
} from "@/lib/types";
import { SMS_TYPE_LABELS, SMS_STATUS_LABELS } from "@/lib/types";
import { Send, Inbox } from "lucide-react";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

function SmsSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton h-14 w-full" />
      ))}
    </div>
  );
}

function SmsContent() {
  const [tab, setTab] = useState("send");
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [clientId, setClientId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState("");
  const [sendError, setSendError] = useState("");

  const {
    page,
    filters,
    setPage,
    setFilter,
    buildApiParams,
  } = useListParams({
    defaultSortBy: "created_at",
    defaultSortOrder: "desc",
    defaultPageSize: 15,
    filterKeys: ["sms_type"],
  });

  const [logData, setLogData] = useState<PaginatedResponse<SmsLog> | null>(null);
  const [logLoading, setLogLoading] = useState(false);

  useEffect(() => {
    api.get<PaginatedResponse<Client>>("/api/clients?size=100").then((r) => setClients(r.items)).catch(() => {});
    api.get<SmsTemplate[]>("/api/sms/templates").then(setTemplates).catch(() => {});
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogLoading(true);
    try {
      const res = await api.get<PaginatedResponse<SmsLog>>(`/api/sms/logs?${buildApiParams()}`);
      setLogData(res);
    } finally {
      setLogLoading(false);
    }
  }, [buildApiParams]);

  useEffect(() => {
    if (tab === "history") fetchLogs();
  }, [tab, fetchLogs]);

  async function handleSend() {
    if (!clientId || !message) return;
    setSending(true);
    setSendError("");
    setSendResult("");
    try {
      await api.post("/api/sms/send", {
        client_id: clientId,
        message,
        sms_type: "custom",
      });
      setSendResult("SMS enviado exitosamente");
      setMessage("");
    } catch (err) {
      if (err instanceof FetchError) setSendError(err.detail);
      else setSendError("Error al enviar SMS");
    } finally {
      setSending(false);
    }
  }

  function applyTemplate(t: SmsTemplate) {
    setMessage(t.body);
  }

  return (
    <div className="space-y-4">
      <h1>SMS</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="send">Enviar</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <div className="max-w-lg space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Cliente *</Label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className={selectClass}
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} {c.phone ? `(${c.phone})` : "(sin telefono)"}
                  </option>
                ))}
              </select>
            </div>

            {templates.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Template (opcional)
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="rounded-md border border-border/60 px-2.5 py-1 text-xs hover:bg-muted/50"
                      onClick={() => applyTemplate(t)}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Mensaje *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={1600}
                placeholder="Escribe tu mensaje..."
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/1600
              </p>
            </div>

            {sendResult && (
              <p className="text-sm text-green-600">{sendResult}</p>
            )}
            {sendError && (
              <p className="text-sm text-destructive">{sendError}</p>
            )}

            <Button
              size="sm"
              onClick={handleSend}
              disabled={sending || !clientId || !message}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {sending ? "Enviando..." : "Enviar SMS"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={filters.sms_type || ""}
                onChange={(e) => setFilter("sms_type", e.target.value || null)}
                className="flex h-8 rounded-lg border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Todos los tipos</option>
                {Object.entries(SMS_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            {logLoading ? (
              <SmsSkeleton />
            ) : logData && logData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No hay SMS enviados</p>
              </div>
            ) : logData ? (
              <>
                <div className="divide-y divide-border/40">
                  {logData.items.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{log.phone_to}</p>
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
                            {SMS_TYPE_LABELS[log.sms_type] ?? log.sms_type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {log.message}
                        </p>
                      </div>
                      <StatusIndicator
                        status={log.status}
                        label={SMS_STATUS_LABELS[log.status] ?? log.status}
                      />
                    </div>
                  ))}
                </div>
                <Pagination
                  page={logData.page}
                  pages={logData.pages}
                  total={logData.total}
                  onPageChange={setPage}
                />
              </>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SmsPage() {
  return (
    <Suspense fallback={<SmsSkeleton />}>
      <SmsContent />
    </Suspense>
  );
}
