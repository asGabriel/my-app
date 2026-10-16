/**
 * Tipos do domínio da barbearia. Enquanto não existe backend, eles são a fonte
 * da verdade do mock; quando as rotas existirem em `openapi/`, troque-os pelos
 * schemas gerados mantendo os mesmos nomes de campo.
 */

export type ServiceCategory = 'cabelo' | 'barba' | 'combos';

export interface Unit {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  /** Horário de funcionamento, "HH:mm". */
  opensAt: string;
  closesAt: string;
  /** Dias da semana sem expediente (0 = domingo, como `Date#getDay`). */
  closedWeekdays: number[];
}

export interface Service {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  /** Pode ser pago com crédito do Clube. */
  includedInClub: boolean;
}

export interface Barber {
  id: string;
  name: string;
  unitIds: string[];
}

export interface ClubPlan {
  id: string;
  name: string;
  priceCents: number;
  description: string;
  /** Créditos por ciclo; `null` = ilimitado. */
  monthlyCredits: number | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  clubPlanId: string | null;
  clubCreditsUsed: number;
  /** Data (YYYY-MM-DD) da próxima renovação do Clube. */
  clubRenewsOn: string | null;
  favoriteBarberId: string | null;
  preferredUnitId: string;
  remindersEnabled: boolean;
}

export type AppointmentStatus = 'scheduled' | 'done' | 'cancelled';

export type PaymentMethod = 'club' | 'app' | 'local';

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerIsClubMember: boolean;
  unitId: string;
  barberId: string;
  serviceIds: string[];
  /** Início em ISO 8601 (horário local). */
  startsAt: string;
  durationMin: number;
  status: AppointmentStatus;
  paymentMethod: PaymentMethod;
  totalCents: number;
}

export interface CreateAppointmentRequest {
  unitId: string;
  /** `null` = "qualquer um": o mock escolhe o primeiro barbeiro livre. */
  barberId: string | null;
  serviceIds: string[];
  startsAt: string;
  paymentMethod: PaymentMethod;
  /** Agendamento que está sendo remarcado — é cancelado ao criar o novo. */
  replacesId?: string;
}

export interface AvailabilityFilters {
  unitId: string;
  barberId: string | null;
  /** YYYY-MM-DD */
  date: string;
  durationMin: number;
}

export interface TimeSlot {
  /** "HH:mm" */
  time: string;
  available: boolean;
}

export type DashboardPeriod = 'day' | 'week' | 'month';

export interface UnitDashboard {
  revenueCents: number;
  appointments: number;
  /** 0–1 */
  occupancy: number;
  activeSubscribers: number;
  renewingThisWeek: number;
  team: { barberId: string; name: string; occupancy: number }[];
}
