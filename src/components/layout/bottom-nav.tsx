"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  FileText,
} from "lucide-react";

const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/dashboard/jobs", label: "Trabajos", icon: Briefcase },
  { href: "/dashboard/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/dashboard/invoices", label: "Facturas", icon: FileText },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-border/60 bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-14 text-[10px] font-medium transition-colors relative",
              isActive
                ? "text-foreground"
                : "text-muted-foreground active:text-foreground"
            )}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-foreground" />
            )}
            <item.icon
              className={cn("h-5 w-5", isActive && "stroke-[2.5]")}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
