"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, FetchError } from "@/lib/api";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/types";
import type { Expense } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

export default function NewExpensePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    category: "materials",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post<Expense>("/api/expenses", {
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount),
        expense_date: form.expense_date,
      });
      router.push("/dashboard/expenses");
      router.refresh();
    } catch (err) {
      if (err instanceof FetchError) setError(err.detail);
      else setError("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6">Nuevo gasto</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs font-medium text-muted-foreground">
            Categoria *
          </Label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className={selectClass}
          >
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs font-medium text-muted-foreground">
            Descripcion *
          </Label>
          <Input
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            maxLength={200}
            placeholder="Ej: Gasolina para la camioneta"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs font-medium text-muted-foreground">
              Monto ($) *
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={0.01}
              step={0.01}
              value={form.amount}
              onChange={handleChange}
              required
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expense_date" className="text-xs font-medium text-muted-foreground">
              Fecha *
            </Label>
            <Input
              id="expense_date"
              name="expense_date"
              type="date"
              value={form.expense_date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Guardando..." : "Crear gasto"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
