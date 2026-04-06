"use client";

interface BarChartData {
  label: string;
  values: { value: number; color: string; label: string }[];
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
}

export function BarChart({ data, height = 200 }: BarChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(
    ...data.flatMap((d) => d.values.map((v) => v.value)),
    1
  );

  return (
    <div className="space-y-2">
      <div
        className="flex items-end gap-1"
        style={{ height }}
      >
        {data.map((item, i) => (
          <div
            key={i}
            className="flex-1 flex items-end gap-px group relative"
          >
            {item.values.map((v, j) => {
              const barHeight = maxValue > 0 ? (v.value / maxValue) * height : 0;
              return (
                <div
                  key={j}
                  className="flex-1 rounded-t-sm transition-opacity group-hover:opacity-80 relative"
                  style={{
                    height: Math.max(barHeight, 2),
                    backgroundColor: v.color,
                  }}
                  title={`${v.label}: $${v.value.toFixed(0)}`}
                />
              );
            })}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap">
              {item.label}
            </div>
          </div>
        ))}
      </div>
      <div className="h-5" />
      <div className="flex gap-4 justify-center">
        {data[0]?.values.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: v.color }}
            />
            {v.label}
          </div>
        ))}
      </div>
    </div>
  );
}
