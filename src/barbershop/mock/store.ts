/**
 * Banco em memória do mock da barbearia. A agenda é gerada relativa a "hoje"
 * (30 dias para trás e 14 para frente), com um gerador pseudoaleatório de
 * semente fixa — a cada reload os dados voltam ao mesmo estado inicial.
 */
import dayjs, { type Dayjs } from 'dayjs';
import type {
  Appointment, AvailabilityFilters, Barber, ClubPlan, CreateAppointmentRequest,
  Customer, DashboardPeriod, PaymentMethod, Service, TimeSlot, Unit, UnitDashboard,
} from './types';

const SLOT_MIN = 30;
const HISTORY_DAYS = 30;
const FUTURE_DAYS = 14;

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

/** mulberry32: PRNG determinístico, para a agenda gerada ser sempre a mesma. */
function prng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = prng(42);
const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];

export const units: Unit[] = [
  { id: 'centro', name: 'Unidade Centro', address: 'Rua XV de Novembro, 410 · Centro', distanceKm: 1.2, opensAt: '09:00', closesAt: '20:00', closedWeekdays: [0] },
  { id: 'zona-sul', name: 'Unidade Zona Sul', address: 'Av. das Palmeiras, 1820 · Jardim Botânico', distanceKm: 3.8, opensAt: '09:00', closesAt: '21:00', closedWeekdays: [0] },
  { id: 'shopping', name: 'Unidade Shopping', address: 'Shopping Estação · Piso L2', distanceKm: 5.1, opensAt: '10:00', closesAt: '22:00', closedWeekdays: [] },
  { id: 'zona-norte', name: 'Unidade Zona Norte', address: 'Rua Itupava, 77 · Alto da XV', distanceKm: 9.4, opensAt: '09:00', closesAt: '18:00', closedWeekdays: [0, 1] },
];

export const services: Service[] = [
  { id: 'corte', category: 'cabelo', name: 'Corte', description: 'Tesoura ou máquina, com lavagem', durationMin: 40, priceCents: 5000, includedInClub: true },
  { id: 'barba', category: 'barba', name: 'Barba', description: 'Toalha quente e navalha', durationMin: 30, priceCents: 4000, includedInClub: true },
  { id: 'corte-barba', category: 'combos', name: 'Corte + Barba', description: 'O serviço completo', durationMin: 70, priceCents: 8000, includedInClub: true },
  { id: 'pigmentacao', category: 'barba', name: 'Pigmentação de barba', description: 'Preenchimento de falhas', durationMin: 30, priceCents: 4500, includedInClub: false },
  { id: 'sobrancelha', category: 'cabelo', name: 'Sobrancelha', description: 'Acabamento na navalha', durationMin: 15, priceCents: 2000, includedInClub: false },
];

export const barbers: Barber[] = [
  { id: 'rafael', name: 'Rafael', unitIds: ['centro', 'zona-sul'] },
  { id: 'thiago', name: 'Thiago', unitIds: ['centro', 'shopping'] },
  { id: 'bruno', name: 'Bruno', unitIds: ['centro', 'zona-norte'] },
  { id: 'diego', name: 'Diego', unitIds: ['shopping', 'zona-sul'] },
  { id: 'caio', name: 'Caio', unitIds: ['zona-norte', 'shopping'] },
];

export const clubPlans: ClubPlan[] = [
  { id: 'corte', name: 'Corte', priceCents: 8990, description: '2 cortes por mês', monthlyCredits: 2 },
  { id: 'essencial', name: 'Essencial', priceCents: 14990, description: '4 cortes ou barbas por mês', monthlyCredits: 4 },
  { id: 'ilimitado', name: 'Ilimitado', priceCents: 22990, description: 'Corte e barba sem limite, prioridade na agenda', monthlyCredits: null },
];

/** O barbeiro "logado" no app do barbeiro. */
export const CURRENT_BARBER_ID = 'rafael';

/** Assinantes do Clube por unidade (o mock não tem a lista de clientes). */
const SUBSCRIBERS_BY_UNIT: Record<string, { active: number; renewingThisWeek: number }> = {
  centro: { active: 48, renewingThisWeek: 5 },
  'zona-sul': { active: 31, renewingThisWeek: 3 },
  shopping: { active: 57, renewingThisWeek: 8 },
  'zona-norte': { active: 12, renewingThisWeek: 1 },
};

export const customer: Customer = {
  id: 'me',
  name: 'Marcelo Andrade',
  phone: '(41) 99876-5432',
  clubPlanId: 'essencial',
  clubCreditsUsed: 2,
  clubRenewsOn: dayjs().add(11, 'day').format('YYYY-MM-DD'),
  favoriteBarberId: 'rafael',
  preferredUnitId: 'centro',
  remindersEnabled: true,
};

export const appointments: Appointment[] = [];

// ---------------------------------------------------------------------------
// Helpers de agenda

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const at = (day: Dayjs, hhmm: string) => day.startOf('day').add(toMinutes(hhmm), 'minute');

export const serviceById = (id: string) => services.find((s) => s.id === id)!;
export const totalDuration = (serviceIds: string[]) => serviceIds.reduce((sum, id) => sum + serviceById(id).durationMin, 0);
export const totalPrice = (serviceIds: string[]) => serviceIds.reduce((sum, id) => sum + serviceById(id).priceCents, 0);

export const isUnitOpenOn = (unit: Unit, day: Dayjs) => !unit.closedWeekdays.includes(day.day());

function overlaps(a: Appointment, start: Dayjs, durationMin: number) {
  const aStart = dayjs(a.startsAt);
  const aEnd = aStart.add(a.durationMin, 'minute');
  return start.isBefore(aEnd) && start.add(durationMin, 'minute').isAfter(aStart);
}

function isBarberFree(barberId: string, start: Dayjs, durationMin: number, ignoreId?: string) {
  return !appointments.some(
    (a) => a.barberId === barberId && a.status !== 'cancelled' && a.id !== ignoreId && overlaps(a, start, durationMin)
  );
}

/** Barbeiros que atendem em mais de uma unidade fazem rodízio diário entre
 * elas; hoje todo mundo está na primeira unidade da lista. */
export function barberUnitOn(barber: Barber, day: Dayjs) {
  const n = barber.unitIds.length;
  const turn = day.startOf('day').diff(dayjs().startOf('day'), 'day') + barbers.indexOf(barber);
  return barber.unitIds[((turn % n) + n) % n];
}

/** Barbeiros da unidade — só os que estão nela em `day`, quando informado. */
function barbersAt(unitId: string, barberId: string | null, day?: Dayjs) {
  return barbers.filter(
    (b) => (day ? barberUnitOn(b, day) === unitId : b.unitIds.includes(unitId)) && (!barberId || b.id === barberId)
  );
}

// ---------------------------------------------------------------------------
// Seed

const OTHER_CLIENTS = [
  'Lucas M.', 'André P.', 'Felipe S.', 'Gustavo R.', 'Marcos T.', 'Pedro H.', 'João V.',
  'Rodrigo L.', 'Vinícius A.', 'Henrique C.', 'Matheus B.', 'Daniel F.', 'Leonardo K.',
];

function seedAppointment(p: {
  customerName: string; isMember: boolean; unitId: string; barberId: string;
  serviceIds: string[]; start: Dayjs; customerId?: string; paymentMethod?: PaymentMethod;
}) {
  const now = dayjs();
  const durationMin = totalDuration(p.serviceIds);
  const paymentMethod = p.paymentMethod ?? (p.isMember ? 'club' : pick<PaymentMethod>(['app', 'local']));
  appointments.push({
    id: nextId('apt'),
    customerId: p.customerId ?? nextId('client'),
    customerName: p.customerName,
    customerIsClubMember: p.isMember,
    unitId: p.unitId,
    barberId: p.barberId,
    serviceIds: p.serviceIds,
    startsAt: p.start.format('YYYY-MM-DDTHH:mm:ss'),
    durationMin,
    status: p.start.add(durationMin, 'minute').isBefore(now) ? 'done' : 'scheduled',
    paymentMethod,
    totalCents: paymentMethod === 'club' ? 0 : totalPrice(p.serviceIds),
  });
}

function seed() {
  const today = dayjs().startOf('day');

  // Agenda de hoje do barbeiro logado, fixa — é a tela que mais se olha.
  const myDay: [string, string, string[], boolean][] = [
    ['09:00', 'Lucas M.', ['corte'], true],
    ['10:00', 'André P.', ['barba'], false],
    ['11:30', 'Felipe S.', ['corte-barba'], true],
    ['14:30', 'Gustavo R.', ['corte-barba'], true],
    ['16:30', 'Marcos T.', ['pigmentacao'], false],
    ['18:00', 'Pedro H.', ['corte', 'sobrancelha'], false],
  ];
  for (const [time, name, serviceIds, isMember] of myDay) {
    seedAppointment({ customerName: name, isMember, unitId: 'centro', barberId: CURRENT_BARBER_ID, serviceIds, start: at(today, time) });
  }

  // Histórico e próximo horário do cliente logado.
  const mine: [number, string, string, string, string[]][] = [
    [-40, '15:00', 'shopping', 'thiago', ['barba']],
    [-26, '10:30', 'centro', 'rafael', ['corte']],
    [-12, '17:00', 'centro', 'rafael', ['corte-barba']],
    [2, '14:30', 'centro', 'rafael', ['corte-barba']],
  ];
  for (const [offset, time, unitId, barberId, serviceIds] of mine) {
    seedAppointment({
      customerId: customer.id, customerName: customer.name, isMember: true, paymentMethod: 'club',
      unitId, barberId, serviceIds, start: at(today.add(offset, 'day'), time),
    });
  }

  // O resto da agenda: cada barbeiro, em cada unidade, ocupa parte dos horários.
  const combos = [['corte'], ['barba'], ['corte-barba'], ['corte-barba'], ['corte'], ['pigmentacao'], ['corte', 'sobrancelha']];
  for (let offset = -HISTORY_DAYS; offset <= FUTURE_DAYS; offset++) {
    const day = today.add(offset, 'day');
    // Quanto mais longe no futuro, mais vazia a agenda.
    const fill = offset <= 0 ? 0.9 : Math.max(0.1, 0.45 - offset * 0.04);
    for (const barber of barbers) {
      // A agenda de hoje do barbeiro logado já foi montada acima.
      if (offset === 0 && barber.id === CURRENT_BARBER_ID) continue;
      const unit = units.find((u) => u.id === barberUnitOn(barber, day))!;
      if (!isUnitOpenOn(unit, day)) continue;
      for (let min = toMinutes(unit.opensAt); min < toMinutes(unit.closesAt) - SLOT_MIN; min += SLOT_MIN) {
        if (random() > fill / 2) continue;
        const serviceIds = pick(combos);
        const start = at(day, toHHmm(min));
        const durationMin = totalDuration(serviceIds);
        if (toMinutes(toHHmm(min)) + durationMin > toMinutes(unit.closesAt)) continue;
        if (!isBarberFree(barber.id, start, durationMin)) continue;
        seedAppointment({ customerName: pick(OTHER_CLIENTS), isMember: random() < 0.4, unitId: unit.id, barberId: barber.id, serviceIds, start });
      }
    }
  }
}
seed();

// ---------------------------------------------------------------------------
// Consultas e comandos (o que um dia vai ser o backend)

export function availableSlots(f: AvailabilityFilters): TimeSlot[] {
  const unit = units.find((u) => u.id === f.unitId)!;
  const day = dayjs(f.date);
  if (!isUnitOpenOn(unit, day)) return [];
  const now = dayjs();
  const candidates = barbersAt(f.unitId, f.barberId, day);
  const slots: TimeSlot[] = [];
  for (let min = toMinutes(unit.opensAt); min + f.durationMin <= toMinutes(unit.closesAt); min += SLOT_MIN) {
    const start = at(day, toHHmm(min));
    const available = start.isAfter(now) && candidates.some((b) => isBarberFree(b.id, start, f.durationMin));
    slots.push({ time: toHHmm(min), available });
  }
  return slots;
}

/** Próximo horário livre (qualquer barbeiro, serviço de 30 min) a partir de agora. */
export function nextFreeSlot(unitId: string): string | null {
  const unit = units.find((u) => u.id === unitId)!;
  for (let offset = 0; offset <= FUTURE_DAYS; offset++) {
    const date = dayjs().add(offset, 'day').format('YYYY-MM-DD');
    const free = availableSlots({ unitId: unit.id, barberId: null, date, durationMin: SLOT_MIN }).find((s) => s.available);
    if (free) return `${date}T${free.time}:00`;
  }
  return null;
}

function remainingCredits() {
  const plan = clubPlans.find((p) => p.id === customer.clubPlanId);
  if (!plan) return 0;
  return plan.monthlyCredits === null ? Infinity : plan.monthlyCredits - customer.clubCreditsUsed;
}

export function createAppointment(req: CreateAppointmentRequest): Appointment {
  const start = dayjs(req.startsAt);
  const durationMin = totalDuration(req.serviceIds);
  const replaced = req.replacesId ? appointments.find((a) => a.id === req.replacesId) : undefined;
  const barber = barbersAt(req.unitId, req.barberId, start).find((b) => isBarberFree(b.id, start, durationMin, replaced?.id));
  if (!barber) throw new Error('Esse horário acabou de ser ocupado. Escolha outro.');

  if (req.paymentMethod === 'club') {
    if (!req.serviceIds.every((id) => serviceById(id).includedInClub)) throw new Error('Algum serviço escolhido não está incluso no Clube.');
    // Remarcar não consome um crédito novo.
    if (replaced?.paymentMethod !== 'club') {
      if (remainingCredits() < 1) throw new Error('Seus créditos do Clube deste mês acabaram.');
      customer.clubCreditsUsed += 1;
    }
  } else if (replaced?.paymentMethod === 'club') {
    customer.clubCreditsUsed -= 1;
  }
  if (replaced) replaced.status = 'cancelled';

  const appointment: Appointment = {
    id: nextId('apt'),
    customerId: customer.id,
    customerName: customer.name,
    customerIsClubMember: customer.clubPlanId !== null,
    unitId: req.unitId,
    barberId: barber.id,
    serviceIds: req.serviceIds,
    startsAt: start.format('YYYY-MM-DDTHH:mm:ss'),
    durationMin,
    status: 'scheduled',
    paymentMethod: req.paymentMethod,
    totalCents: req.paymentMethod === 'club' ? 0 : totalPrice(req.serviceIds),
  };
  appointments.push(appointment);
  return appointment;
}

export function cancelAppointment(id: string) {
  const appointment = appointments.find((a) => a.id === id)!;
  appointment.status = 'cancelled';
  if (appointment.paymentMethod === 'club' && appointment.customerId === customer.id) customer.clubCreditsUsed -= 1;
}

export function setAppointmentDone(id: string, done: boolean) {
  appointments.find((a) => a.id === id)!.status = done ? 'done' : 'scheduled';
}

export function updateCustomer(patch: Partial<Pick<Customer, 'preferredUnitId' | 'remindersEnabled'>>) {
  Object.assign(customer, patch);
}

export function changeClubPlan(planId: string) {
  customer.clubPlanId = planId;
}

function periodRange(period: DashboardPeriod): [Dayjs, Dayjs] {
  const today = dayjs().startOf('day');
  if (period === 'day') return [today, today.endOf('day')];
  if (period === 'week') {
    // Semana de segunda a domingo.
    const monday = today.subtract((today.day() + 6) % 7, 'day');
    return [monday, monday.add(6, 'day').endOf('day')];
  }
  return [today.startOf('month'), today.endOf('month')];
}

export function unitDashboard(unitId: string, period: DashboardPeriod): UnitDashboard {
  const unit = units.find((u) => u.id === unitId)!;
  const [from, to] = periodRange(period);
  const inPeriod = appointments.filter(
    (a) => a.unitId === unitId && a.status !== 'cancelled' && !dayjs(a.startsAt).isBefore(from) && !dayjs(a.startsAt).isAfter(to)
  );
  const openDays: Dayjs[] = [];
  for (let d = from; !d.isAfter(to); d = d.add(1, 'day')) if (isUnitOpenOn(unit, d)) openDays.push(d);
  const dayCapacity = toMinutes(unit.closesAt) - toMinutes(unit.opensAt);

  // Só entra na equipe quem passou pela unidade no período.
  const team = barbersAt(unitId, null).flatMap((b) => {
    const mine = inPeriod.filter((a) => a.barberId === b.id);
    const isHereToday = barberUnitOn(b, dayjs()) === unitId;
    if (!mine.length && !(period === 'day' && isHereToday)) return [];
    // Barbeiros que rodam entre unidades só contam os dias em que estiveram aqui.
    const daysHere = new Set(mine.map((a) => a.startsAt.slice(0, 10))).size || 1;
    const booked = mine.reduce((sum, a) => sum + a.durationMin, 0);
    return [{ barberId: b.id, name: b.name, occupancy: Math.min(1, booked / (daysHere * dayCapacity)) }];
  });

  const subs = SUBSCRIBERS_BY_UNIT[unitId];
  const avgPlanCents = clubPlans.reduce((sum, p) => sum + p.priceCents, 0) / clubPlans.length;
  const subscriptionCents = Math.round((subs.active * avgPlanCents * openDays.length) / 26);

  return {
    revenueCents: inPeriod.reduce((sum, a) => sum + a.totalCents, 0) + subscriptionCents,
    appointments: inPeriod.length,
    occupancy: team.length ? team.reduce((sum, m) => sum + m.occupancy, 0) / team.length : 0,
    activeSubscribers: subs.active,
    renewingThisWeek: subs.renewingThisWeek,
    team,
  };
}
