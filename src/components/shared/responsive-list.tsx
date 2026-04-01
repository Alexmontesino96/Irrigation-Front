"use client";

import { DataTable, type Column } from "@/components/shared/data-table";

interface ResponsiveListProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  onItemClick?: (item: T) => void;
  renderCard: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function ResponsiveList<T extends { id: string }>({
  columns,
  data,
  onItemClick,
  renderCard,
  emptyMessage = "No hay datos",
}: ResponsiveListProps<T>) {
  return (
    <>
      {/* Mobile: cards */}
      <div className="space-y-2 md:hidden">
        {data.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {emptyMessage}
          </p>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden divide-y">
            {data.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3.5 transition-colors active:bg-accent/50 cursor-pointer"
                onClick={() => onItemClick?.(item)}
              >
                {renderCard(item)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={data}
          onRowClick={onItemClick}
          emptyMessage={emptyMessage}
        />
      </div>
    </>
  );
}
