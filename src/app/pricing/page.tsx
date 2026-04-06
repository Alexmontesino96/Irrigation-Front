"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: 65,
    description: "Para tecnicos independientes",
    features: [
      "Gestion de clientes",
      "Propiedades ilimitadas",
      "Trabajos y programacion",
      "Recordatorios automaticos",
    ],
    cta: "Comenzar",
    highlighted: false,
  },
  {
    name: "Profesional",
    price: 100,
    description: "Para negocios en crecimiento",
    features: [
      "Todo de Starter",
      "Facturacion y PDF",
      "Calendario integrado",
      "Dashboard financiero",
    ],
    cta: "Elegir Profesional",
    highlighted: true,
  },
  {
    name: "Premium",
    price: 120,
    description: "Para empresas establecidas",
    features: [
      "Todo de Profesional",
      "SMS automaticos",
      "Control de gastos",
      "Uso ilimitado",
    ],
    cta: "Elegir Premium",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight">
            Planes y precios
          </h1>
          <p className="text-muted-foreground mt-2">
            Elige el plan que mejor se adapte a tu negocio de riego
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 space-y-6 ${
                plan.highlighted
                  ? "border-primary shadow-lg scale-105"
                  : "border-border/60"
              }`}
            >
              {plan.highlighted && (
                <span className="inline-flex items-center rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  Mas popular
                </span>
              )}
              <div>
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.description}
                </p>
                <p className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/mes</span>
                </p>
              </div>

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/register"
                className={buttonVariants({
                  variant: plan.highlighted ? "default" : "outline",
                  className: "w-full",
                })}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
