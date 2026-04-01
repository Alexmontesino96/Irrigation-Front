import {
  Users,
  Briefcase,
  Bell,
  CalendarDays,
  LayoutDashboard,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clientes", shortLabel: "Clientes", icon: Users },
  { href: "/dashboard/jobs", label: "Trabajos", shortLabel: "Trabajos", icon: Briefcase },
  { href: "/dashboard/reminders", label: "Recordatorios", shortLabel: "Alertas", icon: Bell },
  { href: "/dashboard/calendar", label: "Calendario", shortLabel: "Calendario", icon: CalendarDays },
];
