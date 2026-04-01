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

// ── API Error ──

export interface ApiError {
  detail: string;
}
