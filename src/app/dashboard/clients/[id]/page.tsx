"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { api, FetchError } from "@/lib/api";
import type {
  Client,
  Property,
  Job,
  Invoice,
  PaginatedResponse,
} from "@/lib/types";
import {
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
} from "@/lib/types";
import {
  Trash2,
  Plus,
  MapPin,
  MoreHorizontal,
  Mail,
  Phone,
  FileText,
  Briefcase,
  Building2,
  DollarSign,
  ArrowRight,
  Calendar,
  StickyNote,
  Pencil,
  Copy,
  Check,
} from "lucide-react";

/* ── Skeleton ── */

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start gap-4">
        <div className="skeleton size-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-6 w-48" />
          <div className="flex gap-2">
            <div className="skeleton h-5 w-32 rounded-full" />
            <div className="skeleton h-5 w-28 rounded-full" />
          </div>
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border/60 p-4">
            <div className="skeleton h-3 w-20 mb-2" />
            <div className="skeleton h-7 w-12" />
          </div>
        ))}
      </div>
      {/* Tabs skeleton */}
      <div className="skeleton h-8 w-64" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/* ── Copyable text ── */

function CopyableText({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
    >
      {children}
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

/* ── Main Page ── */

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  /* ── Fetch data ── */

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, p, inv] = await Promise.all([
        api.get<Client>(`/api/clients/${id}`),
        api.get<PaginatedResponse<Property>>(
          `/api/clients/${id}/properties?size=100`
        ),
        api
          .get<PaginatedResponse<Invoice>>(
            `/api/invoices?client_id=${id}&size=100`
          )
          .catch(() => ({ items: [] as Invoice[] })),
      ]);
      setClient(c);
      setProperties(p.items);
      setInvoices(inv.items);

      // Fetch jobs for each property in parallel
      if (p.items.length > 0) {
        const jobResults = await Promise.all(
          p.items.map((prop) =>
            api
              .get<PaginatedResponse<Job>>(
                `/api/jobs?property_id=${prop.id}&size=50`
              )
              .catch(() => ({ items: [] as Job[] }))
          )
        );
        const allJobs = jobResults.flatMap((r) => r.items);
        // De-duplicate by id and sort by date desc
        const unique = Array.from(
          new Map(allJobs.map((j) => [j.id, j])).values()
        ).sort(
          (a, b) =>
            new Date(b.scheduled_date).getTime() -
            new Date(a.scheduled_date).getTime()
        );
        setJobs(unique);
      }
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
      else setError("Error al cargar cliente");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Computed stats ── */

  const stats = useMemo(() => {
    const completedJobs = jobs.filter((j) => j.status === "completed").length;
    const totalRevenue = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.total, 0);
    const outstanding = invoices
      .filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((sum, i) => sum + i.total, 0);
    return { completedJobs, totalRevenue, outstanding };
  }, [jobs, invoices]);

  /* ── Delete ── */

  async function handleDelete() {
    try {
      await api.delete(`/api/clients/${id}`);
      router.push("/dashboard/clients");
      router.refresh();
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
    }
  }

  /* ── Initials ── */

  function getInitials(c: Client) {
    return `${c.first_name.charAt(0)}${c.last_name.charAt(0)}`.toUpperCase();
  }

  if (loading) return <DetailSkeleton />;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!client) return <p className="text-destructive">Cliente no encontrado</p>;

  const recentJobs = jobs.slice(0, 5);
  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ═══ Hero Header ═══ */}
      <div className="flex items-start gap-4">
        <Avatar className="size-14 text-lg">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
            {getInitials(client)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="truncate">
              {client.first_name} {client.last_name}
            </h1>
            {!client.is_active && (
              <Badge variant="destructive">Inactivo</Badge>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {client.email && (
              <CopyableText text={client.email}>
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[200px]">{client.email}</span>
              </CopyableText>
            )}
            {client.phone && (
              <CopyableText text={client.phone}>
                <Phone className="h-3 w-3 shrink-0" />
                {client.phone}
              </CopyableText>
            )}
          </div>

          {client.notes && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              <StickyNote className="inline h-3 w-3 mr-1 -mt-0.5" />
              {client.notes}
            </p>
          )}
        </div>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({
              variant: "outline",
              size: "icon-sm",
            })}
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/clients/${id}/edit`)
              }
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Editar cliente
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/clients/${id}/properties/new`)
              }
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              Agregar propiedad
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(`/dashboard/jobs/new`)}
            >
              <Briefcase className="mr-2 h-3.5 w-3.5" />
              Nuevo trabajo
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/invoices/new?client_id=${id}`)
              }
            >
              <FileText className="mr-2 h-3.5 w-3.5" />
              Nueva factura
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Eliminar cliente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ═══ Stats Cards ═══ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Propiedades</p>
          </div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {properties.length}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Trabajos</p>
          </div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {jobs.length}
          </p>
          {stats.completedJobs > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.completedJobs} completados
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border/60 p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Ingresos</p>
          </div>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            ${stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Por cobrar</p>
          </div>
          <p
            className={`text-2xl font-semibold tabular-nums tracking-tight ${
              stats.outstanding > 0 ? "text-[var(--status-overdue)]" : ""
            }`}
          >
            ${stats.outstanding.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* ═══ Tabs ═══ */}
      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="properties">
            Propiedades
            {properties.length > 0 && (
              <span className="ml-1 text-xs tabular-nums text-muted-foreground">
                ({properties.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="jobs">
            Trabajos
            {jobs.length > 0 && (
              <span className="ml-1 text-xs tabular-nums text-muted-foreground">
                ({jobs.length})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Facturas
            {invoices.length > 0 && (
              <span className="ml-1 text-xs tabular-nums text-muted-foreground">
                ({invoices.length})
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Resumen ── */}
        <TabsContent value="overview" className="pt-4 space-y-6">
          {/* Recent Jobs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Trabajos recientes
              </p>
              {jobs.length > 5 && (
                <button
                  type="button"
                  onClick={() => {
                    /* switch to jobs tab programmatically — use a simple approach */
                    const jobsTab = document.querySelector<HTMLButtonElement>(
                      '[data-slot="tabs-trigger"][value="jobs"]'
                    );
                    jobsTab?.click();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
            {recentJobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                message="Sin trabajos registrados"
                action={
                  <Link
                    href="/dashboard/jobs/new"
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: "text-xs",
                    })}
                  >
                    Crear trabajo
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-border/40">
                {recentJobs.map((j) => (
                  <div
                    key={j.id}
                    className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                    onClick={() => router.push(`/dashboard/jobs/${j.id}`)}
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{j.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {j.scheduled_date} —{" "}
                        {JOB_TYPE_LABELS[j.job_type] ?? j.job_type}
                        {j.property_name && ` — ${j.property_name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {j.price != null && (
                        <span className="text-xs tabular-nums text-muted-foreground">
                          ${j.price}
                        </span>
                      )}
                      <StatusIndicator
                        status={j.status}
                        label={JOB_STATUS_LABELS[j.status] ?? j.status}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Recent Invoices */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Facturas recientes
              </p>
              {invoices.length > 5 && (
                <button
                  type="button"
                  onClick={() => {
                    const invTab = document.querySelector<HTMLButtonElement>(
                      '[data-slot="tabs-trigger"][value="invoices"]'
                    );
                    invTab?.click();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
            {recentInvoices.length === 0 ? (
              <EmptyState
                icon={FileText}
                message="Sin facturas"
                action={
                  <Link
                    href={`/dashboard/invoices/new?client_id=${id}`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: "text-xs",
                    })}
                  >
                    Crear factura
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-border/40">
                {recentInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                    onClick={() =>
                      router.push(`/dashboard/invoices/${inv.id}`)
                    }
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {inv.invoice_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {inv.issue_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-medium tabular-nums">
                        ${inv.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <StatusIndicator
                        status={inv.status === "paid" ? "completed" : inv.status === "overdue" ? "overdue" : inv.status === "sent" ? "scheduled" : "cancelled"}
                        label={
                          INVOICE_STATUS_LABELS[inv.status] ?? inv.status
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Tab: Propiedades ── */}
        <TabsContent value="properties" className="pt-4 space-y-4">
          <div className="flex items-center justify-end">
            <Link
              href={`/dashboard/clients/${id}/properties/new`}
              className={buttonVariants({ size: "sm", className: "h-8" })}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nueva propiedad
            </Link>
          </div>

          {properties.length === 0 ? (
            <EmptyState
              icon={MapPin}
              message="Sin propiedades registradas"
              action={
                <Link
                  href={`/dashboard/clients/${id}/properties/new`}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className: "text-xs",
                  })}
                >
                  Agregar propiedad
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {properties.map((p) => {
                const propJobs = jobs.filter(
                  (j) => j.property_id === p.id
                );
                const activeJobs = propJobs.filter(
                  (j) => j.status === "scheduled" || j.status === "in_progress"
                ).length;

                return (
                  <div
                    key={p.id}
                    className="group rounded-xl border border-border/60 p-4 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
                    onClick={() =>
                      router.push(
                        `/dashboard/clients/${id}/properties/${p.id}`
                      )
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-muted p-2 shrink-0">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {p.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {p.address}
                        </p>
                        {p.city && (
                          <p className="text-xs text-muted-foreground">
                            {p.city}
                            {p.state ? `, ${p.state}` : ""}{" "}
                            {p.zip_code || ""}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </div>
                    {propJobs.length > 0 && (
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/40">
                        <span className="text-xs text-muted-foreground">
                          {propJobs.length} trabajo{propJobs.length !== 1 && "s"}
                        </span>
                        {activeJobs > 0 && (
                          <span className="text-xs text-[var(--status-scheduled)]">
                            {activeJobs} activo{activeJobs !== 1 && "s"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Trabajos ── */}
        <TabsContent value="jobs" className="pt-4 space-y-4">
          <div className="flex items-center justify-end">
            <Link
              href="/dashboard/jobs/new"
              className={buttonVariants({ size: "sm", className: "h-8" })}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nuevo trabajo
            </Link>
          </div>

          {jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              message="Sin trabajos registrados"
              action={
                <Link
                  href="/dashboard/jobs/new"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className: "text-xs",
                  })}
                >
                  Crear trabajo
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-border/40">
              {jobs.map((j) => (
                <div
                  key={j.id}
                  className="flex items-center gap-3 py-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                  onClick={() => router.push(`/dashboard/jobs/${j.id}`)}
                >
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{j.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {j.scheduled_date} —{" "}
                      {JOB_TYPE_LABELS[j.job_type] ?? j.job_type}
                      {j.property_name && (
                        <span className="ml-1">
                          — <MapPin className="inline h-3 w-3 -mt-0.5" />{" "}
                          {j.property_name}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {j.price != null && (
                      <span className="text-xs tabular-nums text-muted-foreground hidden sm:inline">
                        ${j.price}
                      </span>
                    )}
                    <StatusIndicator
                      status={j.status}
                      label={JOB_STATUS_LABELS[j.status] ?? j.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Facturas ── */}
        <TabsContent value="invoices" className="pt-4 space-y-4">
          <div className="flex items-center justify-end">
            <Link
              href={`/dashboard/invoices/new?client_id=${id}`}
              className={buttonVariants({ size: "sm", className: "h-8" })}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nueva factura
            </Link>
          </div>

          {invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              message="Sin facturas"
              action={
                <Link
                  href={`/dashboard/invoices/new?client_id=${id}`}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className: "text-xs",
                  })}
                >
                  Crear factura
                </Link>
              }
            />
          ) : (
            <>
              {/* Invoice summary bar */}
              <div className="flex items-center gap-4 rounded-lg bg-muted/50 px-4 py-2.5">
                {(["paid", "sent", "overdue", "draft"] as const).map(
                  (status) => {
                    const count = invoices.filter(
                      (i) => i.status === status
                    ).length;
                    if (count === 0) return null;
                    return (
                      <span
                        key={status}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            status === "paid"
                              ? "bg-[var(--status-completed)]"
                              : status === "overdue"
                                ? "bg-[var(--status-overdue)]"
                                : status === "sent"
                                  ? "bg-[var(--status-scheduled)]"
                                  : "bg-muted-foreground"
                          }`}
                        />
                        {count} {INVOICE_STATUS_LABELS[status]}
                      </span>
                    );
                  }
                )}
              </div>

              <div className="divide-y divide-border/40">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3 py-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                    onClick={() =>
                      router.push(`/dashboard/invoices/${inv.id}`)
                    }
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {inv.invoice_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Emitida {inv.issue_date} — Vence {inv.due_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-medium tabular-nums">
                        ${inv.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <StatusIndicator
                        status={inv.status === "paid" ? "completed" : inv.status === "overdue" ? "overdue" : inv.status === "sent" ? "scheduled" : "cancelled"}
                        label={
                          INVOICE_STATUS_LABELS[inv.status] ?? inv.status
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ Delete Dialog ═══ */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar cliente"
        description={`¿Estas seguro de eliminar a ${client.first_name} ${client.last_name}? El cliente sera marcado como inactivo.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}

/* ── Empty State ── */

function EmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-10 text-muted-foreground">
      <Icon className="h-8 w-8 mb-2 opacity-40" />
      <p className="text-sm">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
