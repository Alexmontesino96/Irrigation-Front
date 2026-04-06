"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api, FetchError } from "@/lib/api";
import type { Subscription } from "@/lib/types";
import { PLAN_LABELS } from "@/lib/types";
import { Check } from "lucide-react";

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ["Clientes", "Propiedades", "Trabajos", "Recordatorios"],
  professional: [
    "Todo de Starter",
    "Facturas",
    "Calendario",
    "Dashboard Financiero",
  ],
  premium: [
    "Todo de Profesional",
    "SMS Automaticos",
    "Control de Gastos",
    "Uso ilimitado",
  ],
};

const PLAN_PRICES: Record<string, number> = {
  starter: 65,
  professional: 100,
  premium: 120,
};

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Subscription>("/api/subscriptions/current")
      .then(setSub)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCheckout(plan: string) {
    try {
      const res = await api.post<{ checkout_url: string | null }>(
        "/api/subscriptions/checkout",
        {
          plan,
          success_url: `${window.location.origin}/dashboard/settings/billing?success=true`,
          cancel_url: `${window.location.origin}/dashboard/settings/billing`,
        }
      );
      if (res.checkout_url) window.location.href = res.checkout_url;
    } catch (err) {
      if (err instanceof FetchError) alert(err.detail);
    }
  }

  async function handlePortal() {
    try {
      const res = await api.post<{ portal_url: string | null }>(
        "/api/subscriptions/portal",
        {}
      );
      if (res.portal_url) window.location.href = res.portal_url;
    } catch (err) {
      if (err instanceof FetchError) alert(err.detail);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1>Plan y Facturacion</h1>

      {sub && (
        <div className="rounded-lg border border-border/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Plan actual</p>
              <p className="text-lg font-semibold">
                {PLAN_LABELS[sub.plan as keyof typeof PLAN_LABELS] ?? sub.plan}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                Estado: {sub.status}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handlePortal}>
              Gestionar facturacion
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(PLAN_FEATURES).map(([plan, features]) => (
          <div
            key={plan}
            className={`rounded-lg border p-4 space-y-4 ${
              sub?.plan === plan ? "border-primary" : "border-border/60"
            }`}
          >
            <div>
              <p className="font-semibold">
                {PLAN_LABELS[plan as keyof typeof PLAN_LABELS] ?? plan}
              </p>
              <p className="text-2xl font-bold mt-1">
                ${PLAN_PRICES[plan]}<span className="text-sm font-normal text-muted-foreground">/mes</span>
              </p>
            </div>
            <ul className="space-y-2">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  {f}
                </li>
              ))}
            </ul>
            {sub?.plan === plan ? (
              <Button variant="outline" size="sm" className="w-full" disabled>
                Plan actual
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full"
                onClick={() => handleCheckout(plan)}
              >
                Seleccionar
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
