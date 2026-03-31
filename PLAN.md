# Plan Frontend - Irrigation System CRM

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- @supabase/ssr (auth)
- Backend: FastAPI en localhost:8000

---

## Modulo 0: Infraestructura Base
> Pre-requisito para todos los demas modulos

- [x] `lib/api.ts` - Cliente HTTP con token Supabase automatico
- [x] `lib/types.ts` - Interfaces TypeScript de todos los modelos del backend
- [x] Dashboard layout con sidebar navegable
- [x] Componentes shared: data-table, pagination, confirm-dialog
- [x] CORS configurado en backend (main.py)

**Estructura:**
```
src/
├── lib/
│   ├── api.ts              # fetchApi() wrapper
│   └── types.ts            # Client, Property, Job, Reminder, etc.
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx     # Nav lateral
│   │   └── header.tsx      # Header con user + logout
│   └── shared/
│       ├── data-table.tsx  # Tabla generica
│       ├── pagination.tsx  # Controles paginacion
│       └── confirm-dialog.tsx
├── hooks/
│   └── use-api.ts
└── app/dashboard/
    └── layout.tsx          # Layout con sidebar
```

---

## Modulo 1: Clientes
- [x] `/dashboard/clients` - Tabla con busqueda, paginacion, filtro activos
- [x] `/dashboard/clients/new` - Formulario crear
- [x] `/dashboard/clients/[id]` - Detalle + propiedades del cliente
- [x] `/dashboard/clients/[id]/edit` - Formulario editar
- [x] Soft delete con confirmacion

**Endpoints:** GET/POST/PATCH/DELETE `/api/clients`

---

## Modulo 2: Propiedades
- [x] `/dashboard/properties/[id]` - Detalle (sistemas + jobs)
- [x] `/dashboard/properties/[id]/edit` - Editar
- [x] Crear propiedad desde detalle de cliente (modal o pagina)

**Endpoints:** CRUD en `/api/clients/{client_id}/properties`

---

## Modulo 3: Sistemas de Riego
- [x] Seccion dentro de detalle de propiedad (no pagina propia)
- [x] Cards o acordeon con lista de sistemas
- [x] Modal para crear/editar sistema

**Endpoints:** CRUD en `/api/properties/{property_id}/systems`

---

## Modulo 4: Trabajos (CORE)
- [x] `/dashboard/jobs` - Tabla con filtros (status, tipo, propiedad)
- [x] `/dashboard/jobs/new` - Formulario con selector propiedad + reminder_days
- [x] `/dashboard/jobs/[id]` - Detalle + notas + recordatorios generados
- [x] `/dashboard/jobs/[id]/edit` - Editar + cambiar status
- [x] Confirmacion al completar job (genera recordatorios automaticos)

**Campos criticos:** property_id, title, job_type, scheduled_date, price, reminder_days[]
**Endpoints:** CRUD en `/api/jobs`

---

## Modulo 5: Notas de Trabajo
- [x] Seccion inline en detalle de trabajo
- [x] Textarea para agregar nota
- [x] Editar/eliminar notas existentes

**Endpoints:** CRUD en `/api/jobs/{job_id}/notes`

---

## Modulo 6: Recordatorios
- [x] `/dashboard/reminders` con tabs: Proximos | Todos
- [x] Tab "Proximos": GET `/api/reminders/upcoming?days=30`
- [x] Tab "Todos": GET `/api/reminders?status=pending`
- [x] Acciones: completar, cancelar, crear manual
- [x] Indicador visual auto-generado vs manual

**Endpoints:** CRUD en `/api/reminders` + GET `/api/reminders/upcoming`

---

## Modulo 7: Calendario
- [x] `/dashboard/calendar` - Vista mensual
- [x] Jobs (por scheduled_date) + Recordatorios (por remind_date)
- [x] Navegacion mes anterior/siguiente
- [x] Click en evento abre detalle
- [x] Colores por tipo (job vs reminder, status)

**Endpoint:** GET `/api/calendar?start=...&end=...`

---

## Modulo 8: Dashboard Principal
- [x] `/dashboard` - Vista resumen
- [x] Recordatorios proximos (7 dias)
- [x] Trabajos de la semana
- [x] Stats: clientes activos, jobs pendientes
- [x] Accesos rapidos: nuevo cliente, nuevo trabajo

**Se construye con:** reminders/upcoming + jobs + clients (no hay endpoint dashboard)

---

## Orden de implementacion recomendado
```
0. Infraestructura ──→ 1. Clientes ──→ 2. Propiedades ──→ 3. Sistemas
                                                              │
    8. Dashboard ←── 7. Calendario ←── 6. Recordatorios ←── 4. Trabajos
                                                              │
                                                         5. Notas
```
