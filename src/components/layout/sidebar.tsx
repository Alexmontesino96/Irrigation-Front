"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";
import { Droplets, Settings } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r border-border/60 bg-sidebar">
      {/* Brand area */}
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-border/60">
        <span className="flex items-center justify-center rounded-lg bg-emerald-600 p-1.5 text-white shrink-0">
          <Droplets className="h-4 w-4" />
        </span>
        <Link
          href="/dashboard"
          className="text-base font-bold tracking-tight text-foreground"
        >
          IrrigationPro
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1 px-3 py-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Settings pinned at bottom */}
      <div className="mt-auto border-t border-border/60 px-3 py-3">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/dashboard/settings")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          Configuracion
        </Link>
      </div>
    </aside>
  );
}
