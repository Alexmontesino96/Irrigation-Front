"use client";

import { useScale } from "@/lib/scale-context";
import { Button } from "@/components/ui/button";
import { Minus, Plus, RotateCcw } from "lucide-react";

export function ScaleControl() {
  const { scale, scaleUp, scaleDown, resetScale, canScaleUp, canScaleDown } =
    useScale();

  const pct = Math.round(scale * 100);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={scaleDown}
        disabled={!canScaleDown}
        aria-label="Reducir tamano"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <button
        onClick={resetScale}
        className="min-w-[3rem] text-center text-xs tabular-nums text-muted-foreground hover:text-foreground transition-colors"
        title="Restablecer tamano"
      >
        {pct}%
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={scaleUp}
        disabled={!canScaleUp}
        aria-label="Aumentar tamano"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
