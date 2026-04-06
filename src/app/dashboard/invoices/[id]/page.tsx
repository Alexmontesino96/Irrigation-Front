"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api, FetchError } from "@/lib/api";
import type { Invoice } from "@/lib/types";
import { INVOICE_STATUS_LABELS } from "@/lib/types";
import { Download, Send, CheckCircle, Trash2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="skeleton h-6 w-56" />
      <div className="skeleton h-40 w-full" />
    </div>
  );
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Invoice>(`/api/invoices/${id}`);
      setInvoice(res);
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
      else setError("Error al cargar factura");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  async function updateStatus(status: string, paid_date?: string) {
    try {
      const payload: Record<string, string> = { status };
      if (paid_date) payload.paid_date = paid_date;
      await api.patch(`/api/invoices/${id}`, payload);
      fetchInvoice();
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/api/invoices/${id}`);
      router.push("/dashboard/invoices");
      router.refresh();
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
    }
  }

  async function downloadPdf() {
    // We need the auth token for the PDF download
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch(`${API_BASE}/api/invoices/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice?.invoice_number || "invoice"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <DetailSkeleton />;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!invoice) return <p className="text-destructive">Factura no encontrada</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1>{invoice.invoice_number}</h1>
          <div className="mt-1.5 flex items-center gap-3">
            <StatusIndicator
              status={invoice.status}
              label={INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
            />
            <span className="text-xs text-muted-foreground">
              {invoice.client_name}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={downloadPdf}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            PDF
          </Button>
          {invoice.status === "draft" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus("sent")}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Enviar
            </Button>
          )}
          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <Button
              size="sm"
              onClick={() =>
                updateStatus("paid", new Date().toISOString().split("T")[0])
              }
            >
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              Pagada
            </Button>
          )}
          {invoice.status === "draft" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Detalles
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Fecha emision</p>
            <p className="text-sm mt-0.5">{invoice.issue_date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fecha vencimiento</p>
            <p className="text-sm mt-0.5">{invoice.due_date}</p>
          </div>
          {invoice.paid_date && (
            <div>
              <p className="text-xs text-muted-foreground">Fecha pago</p>
              <p className="text-sm mt-0.5">{invoice.paid_date}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Items
        </p>
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-xs">Descripcion</th>
                <th className="px-3 py-2 text-right font-medium text-xs">Cant.</th>
                <th className="px-3 py-2 text-right font-medium text-xs">Precio</th>
                <th className="px-3 py-2 text-right font-medium text-xs">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">{item.description}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">${item.unit_price.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 space-y-1 text-right text-sm">
          <p>Subtotal: <span className="font-medium">${invoice.subtotal.toFixed(2)}</span></p>
          <p>Impuesto ({invoice.tax_rate}%): <span className="font-medium">${invoice.tax_amount.toFixed(2)}</span></p>
          <p className="text-base font-semibold">Total: ${invoice.total.toFixed(2)}</p>
        </div>
      </div>

      {invoice.notes && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Notas
          </p>
          <p className="text-sm">{invoice.notes}</p>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar factura"
        description={`¿Eliminar factura ${invoice.invoice_number}? Solo se pueden eliminar borradores.`}
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
