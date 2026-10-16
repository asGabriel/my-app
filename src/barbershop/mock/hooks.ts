/**
 * Hooks da barbearia no formato que os de `src/api/hooks` vão ter, mas lendo e
 * escrevendo no store em memória (`./store`). Quando o backend existir, basta
 * reimplementar este arquivo sobre o client gerado — as telas não mudam.
 */
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as store from './store';
import type {
  Appointment, AvailabilityFilters, CreateAppointmentRequest, Customer, DashboardPeriod,
} from './types';

const LATENCY_MS = 150;
const delay = <T,>(value: () => T): Promise<T> =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      try {
        resolve(value());
      } catch (error) {
        reject(error);
      }
    }, LATENCY_MS)
  );

/** Cópia rasa: o React Query não pode receber objetos que o store muta. */
const copy = <T extends object>(list: T[]) => list.map((item) => ({ ...item }));

export function useUnits() {
  return useQuery({
    queryKey: ['barbershop', 'units'],
    queryFn: () =>
      delay(() => store.units.map((u) => ({ ...u, nextFreeSlot: store.nextFreeSlot(u.id) }))),
  });
}

export function useServices() {
  return useQuery({ queryKey: ['barbershop', 'services'], queryFn: () => delay(() => copy(store.services)) });
}

export function useBarbers(unitId?: string) {
  return useQuery({
    queryKey: ['barbershop', 'barbers', unitId],
    queryFn: () => delay(() => copy(store.barbers.filter((b) => !unitId || b.unitIds.includes(unitId)))),
  });
}

export function useClubPlans() {
  return useQuery({ queryKey: ['barbershop', 'club-plans'], queryFn: () => delay(() => copy(store.clubPlans)) });
}

export function useCustomer() {
  return useQuery({ queryKey: ['barbershop', 'customer'], queryFn: () => delay<Customer>(() => ({ ...store.customer })) });
}

export function useMyAppointments() {
  return useQuery({
    queryKey: ['barbershop', 'appointments', 'mine'],
    queryFn: () =>
      delay<Appointment[]>(() =>
        copy(store.appointments.filter((a) => a.customerId === store.customer.id && a.status !== 'cancelled'))
      ),
  });
}

export function useAvailableSlots(filters: AvailabilityFilters, enabled = true) {
  return useQuery({
    queryKey: ['barbershop', 'appointments', 'slots', filters],
    enabled,
    queryFn: () => delay(() => store.availableSlots(filters)),
  });
}

/** Agenda de um barbeiro em um dia (YYYY-MM-DD). */
export function useBarberAgenda(barberId: string, date: string) {
  return useQuery({
    queryKey: ['barbershop', 'appointments', 'agenda', barberId, date],
    queryFn: () =>
      delay<Appointment[]>(() =>
        copy(
          store.appointments
            .filter((a) => a.barberId === barberId && a.status !== 'cancelled' && dayjs(a.startsAt).isSame(date, 'day'))
            .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        )
      ),
  });
}

export function useUnitDashboard(unitId: string, period: DashboardPeriod, enabled = true) {
  return useQuery({
    queryKey: ['barbershop', 'appointments', 'dashboard', unitId, period],
    enabled,
    queryFn: () => delay(() => store.unitDashboard(unitId, period)),
  });
}

function useInvalidate(...keys: string[]) {
  const queryClient = useQueryClient();
  return () => keys.forEach((k) => queryClient.invalidateQueries({ queryKey: ['barbershop', k] }));
}

export function useCreateAppointment() {
  const invalidate = useInvalidate('appointments', 'customer', 'units');
  return useMutation({
    mutationFn: (req: CreateAppointmentRequest) => delay(() => store.createAppointment(req)),
    onSuccess: invalidate,
  });
}

export function useCancelAppointment() {
  const invalidate = useInvalidate('appointments', 'customer', 'units');
  return useMutation({
    mutationFn: (id: string) => delay(() => store.cancelAppointment(id)),
    onSuccess: invalidate,
  });
}

export function useSetAppointmentDone() {
  const invalidate = useInvalidate('appointments');
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => delay(() => store.setAppointmentDone(id, done)),
    onSuccess: invalidate,
  });
}

export function useUpdateCustomer() {
  const invalidate = useInvalidate('customer');
  return useMutation({
    mutationFn: (patch: Parameters<typeof store.updateCustomer>[0]) => delay(() => store.updateCustomer(patch)),
    onSuccess: invalidate,
  });
}

export function useChangeClubPlan() {
  const invalidate = useInvalidate('customer');
  return useMutation({
    mutationFn: (planId: string) => delay(() => store.changeClubPlan(planId)),
    onSuccess: invalidate,
  });
}
