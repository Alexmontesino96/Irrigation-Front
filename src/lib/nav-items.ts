import {
  Users,
  Building2,
  Briefcase,
  Bell,
  CalendarDays,
  LayoutDashboard,
  Receipt,
  FileText,
  MessageSquare,
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clientes", shortLabel: "Clientes", icon: Users },
  { href: "/dashboard/properties", label: "Propiedades", shortLabel: "Propiedades", icon: Building2 },
  { href: "/dashboard/jobs", label: "Trabajos", shortLabel: "Trabajos", icon: Briefcase },
  { href: "/dashboard/invoices", label: "Facturas", shortLabel: "Facturas", icon: FileText },
  { href: "/dashboard/expenses", label: "Gastos", shortLabel: "Gastos", icon: Receipt },
  { href: "/dashboard/reminders", label: "Recordatorios", shortLabel: "Alertas", icon: Bell },
  { href: "/dashboard/calendar", label: "Calendario", shortLabel: "Calendario", icon: CalendarDays },
  { href: "/dashboard/sms", label: "SMS", shortLabel: "SMS", icon: MessageSquare },
];
