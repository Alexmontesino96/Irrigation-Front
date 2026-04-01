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
      <div className="space-y-3 md:hidden">
        {data.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {emptyMessage}
          </p>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border bg-card p-4 transition-transform active:scale-[0.98] cursor-pointer"
              onClick={() => onItemClick?.(item)}
            >
              {renderCard(item)}
            </div>
          ))
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
