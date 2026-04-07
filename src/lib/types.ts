// ── Enums ──

export const JOB_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const JOB_TYPE = {
  MAINTENANCE: "maintenance",
  REPAIR: "repair",
  INSTALLATION: "installation",
  INSPECTION: "inspection",
  WINTERIZATION: "winterization",
  SPRING_STARTUP: "spring_startup",
} as const;

export type JobType = (typeof JOB_TYPE)[keyof typeof JOB_TYPE];

export const REMINDER_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type ReminderStatus =
  (typeof REMINDER_STATUS)[keyof typeof REMINDER_STATUS];

// ── Labels para UI ──

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  scheduled: "Programado",
  in_progress: "En progreso",
  completed: "Completado",
  cancelled: "Cancelado",
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  maintenance: "Mantenimiento",
  repair: "Reparacion",
  installation: "Instalacion",
  inspection: "Inspeccion",
  winterization: "Winterizacion",
  spring_startup: "Arranque primavera",
};

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: "Pendiente",
  sent: "Enviado",
  completed: "Completado",
  cancelled: "Cancelado",
};

// ── Paginated Response ──

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ── Client ──

export interface Client {
  id: string;
  owner_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface ClientUpdate {
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

// ── Property ──

export interface Property {
  id: string;
  client_id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyCreate {
  name: string;
  address: string;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  notes?: string | null;
}

export interface PropertyUpdate {
  name?: string;
  address?: string;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  notes?: string | null;
}

export interface PropertyWithClient {
  id: string;
  client_id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  client_name: string;
  created_at: string;
  updated_at: string;
}

// ── Irrigation System ──

export interface IrrigationSystem {
  id: string;
  property_id: string;
  name: string;
  system_type: string;
  zone_count: number | null;
  install_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IrrigationSystemCreate {
  name: string;
  system_type: string;
  zone_count?: number | null;
  install_date?: string | null;
  notes?: string | null;
}

export interface IrrigationSystemUpdate {
  name?: string;
  system_type?: string;
  zone_count?: number | null;
  install_date?: string | null;
  notes?: string | null;
}

// ── Job ──

export interface Job {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  job_type: JobType;
  status: JobStatus;
  scheduled_date: string;
  completed_date: string | null;
  price: number | null;
  reminder_days: number[] | null;
  notes: string | null;
  client_name: string | null;
  property_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobCreate {
  property_id: string;
  title: string;
  description?: string | null;
  job_type?: JobType;
  scheduled_date: string;
  price?: number | null;
  reminder_days?: number[] | null;
  notes?: string | null;
}

export interface JobUpdate {
  title?: string;
  description?: string | null;
  job_type?: JobType;
  status?: JobStatus;
  scheduled_date?: string;
  completed_date?: string | null;
  price?: number | null;
  reminder_days?: number[] | null;
  notes?: string | null;
}

// ── Job Note ──

export interface JobNote {
  id: string;
  job_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface JobNoteCreate {
  content: string;
}

export interface JobNoteUpdate {
  content: string;
}

// ── Reminder ──

export interface Reminder {
  id: string;
  job_id: string | null;
  property_id: string;
  title: string;
  description: string | null;
  remind_date: string;
  status: ReminderStatus;
  is_auto_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderCreate {
  property_id: string;
  job_id?: string | null;
  title: string;
  description?: string | null;
  remind_date: string;
}

export interface ReminderUpdate {
  title?: string;
  description?: string | null;
  remind_date?: string;
  status?: ReminderStatus;
}

// ── Calendar ──

export interface CalendarEvent {
  id: string;
  type: "job" | "reminder";
  title: string;
  date: string;
  status: string;
  job_type: string | null;
  property_id: string;
  job_id: string | null;
}

export interface CalendarDay {
  date: string;
  events: CalendarEvent[];
}

export interface CalendarResponse {
  start: string;
  end: string;
  days: CalendarDay[];
  total_events: number;
}

// ── Job Material ──

export interface JobMaterial {
  id: string;
  job_id: string;
  name: string;
  quantity: number;
  unit_cost: number;
  total: number;
  created_at: string;
}

export interface JobMaterialCreate {
  name: string;
  quantity?: number;
  unit_cost: number;
}

export interface JobMaterialUpdate {
  name?: string;
  quantity?: number;
  unit_cost?: number;
}

// ── Expense ──

export const EXPENSE_CATEGORY = {
  MATERIALS: "materials",
  FUEL: "fuel",
  EQUIPMENT: "equipment",
  LABOR: "labor",
  OFFICE: "office",
  OTHER: "other",
} as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORY)[keyof typeof EXPENSE_CATEGORY];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  materials: "Materiales",
  fuel: "Combustible",
  equipment: "Equipo",
  labor: "Mano de obra",
  office: "Oficina",
  other: "Otro",
};

export interface Expense {
  id: string;
  owner_id: string;
  job_id: string | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  receipt_url: string | null;
  created_at: string;
}

export interface ExpenseCreate {
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  job_id?: string | null;
}

export interface ExpenseUpdate {
  category?: string;
  description?: string;
  amount?: number;
  expense_date?: string;
  job_id?: string | null;
}

// ── Invoice ──

export const INVOICE_STATUS = {
  DRAFT: "draft",
  SENT: "sent",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Cancelada",
};

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  job_id: string | null;
  created_at: string;
}

export interface InvoiceItemCreate {
  description: string;
  quantity?: number;
  unit_price: number;
  job_id?: string | null;
}

export interface Invoice {
  id: string;
  owner_id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  paid_date: string | null;
  client_name: string | null;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceCreate {
  client_id: string;
  issue_date: string;
  due_date: string;
  tax_rate?: number;
  notes?: string | null;
  items: InvoiceItemCreate[];
}

export interface InvoiceUpdate {
  status?: string;
  due_date?: string;
  tax_rate?: number;
  notes?: string | null;
  paid_date?: string | null;
}

// ── SMS ──

export const SMS_TYPE = {
  REMINDER: "reminder",
  APPOINTMENT: "appointment",
  INVOICE: "invoice",
  CUSTOM: "custom",
} as const;

export type SmsType = (typeof SMS_TYPE)[keyof typeof SMS_TYPE];

export const SMS_TYPE_LABELS: Record<SmsType, string> = {
  reminder: "Recordatorio",
  appointment: "Cita",
  invoice: "Factura",
  custom: "Personalizado",
};

export const SMS_STATUS_LABELS: Record<string, string> = {
  queued: "En cola",
  sent: "Enviado",
  delivered: "Entregado",
  failed: "Fallido",
};

export interface SmsLog {
  id: string;
  owner_id: string;
  client_id: string;
  phone_to: string;
  message: string;
  sms_type: SmsType;
  status: string;
  twilio_sid: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface SmsTemplate {
  id: string;
  owner_id: string;
  name: string;
  sms_type: SmsType;
  body: string;
  is_active: boolean;
  created_at: string;
}

export interface SmsTemplateCreate {
  name: string;
  sms_type: string;
  body: string;
}

// ── Analytics ──

export interface FinancialSummary {
  revenue_this_month: number;
  revenue_last_month: number;
  revenue_change_pct: number;
  expenses_this_month: number;
  profit_margin: number;
  outstanding: number;
  jobs_completed: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

// ── Subscription ──

export const PLAN_TIER = {
  STARTER: "starter",
  PROFESSIONAL: "professional",
  PREMIUM: "premium",
} as const;

export type PlanTier = (typeof PLAN_TIER)[keyof typeof PLAN_TIER];

export const PLAN_LABELS: Record<PlanTier, string> = {
  starter: "Starter",
  professional: "Profesional",
  premium: "Premium",
};

export interface Subscription {
  id: string;
  owner_id: string;
  plan: PlanTier;
  status: string;
  stripe_customer_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

// ── API Error ──

export interface ApiError {
  detail: string;
}
