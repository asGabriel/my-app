import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PaymentMethod } from './mock';

/** Rascunho do agendamento, montado ao longo dos 3 passos (serviço →
 * barbeiro/horário → confirmação). A unidade vem do cliente
 * (`preferredUnitId`), não do rascunho. */
export interface BookingDraft {
  serviceIds: string[];
  /** `null` = "qualquer um". */
  barberId: string | null;
  /** YYYY-MM-DD */
  date: string | null;
  /** "HH:mm" */
  time: string | null;
  paymentMethod: PaymentMethod | null;
  /** Preenchido quando o fluxo começou em "Remarcar". */
  replacesId?: string;
}

const EMPTY: BookingDraft = { serviceIds: [], barberId: null, date: null, time: null, paymentMethod: null };

interface BookingContextValue {
  draft: BookingDraft;
  update: (patch: Partial<BookingDraft>) => void;
  /** Começa um rascunho novo, opcionalmente pré-preenchido (Remarcar/Repetir). */
  start: (initial?: Partial<BookingDraft>) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>(EMPTY);
  const value = useMemo<BookingContextValue>(
    () => ({
      draft,
      update: (patch) => setDraft((current) => ({ ...current, ...patch })),
      start: (initial) => setDraft({ ...EMPTY, ...initial }),
    }),
    [draft]
  );
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking precisa estar dentro de <BookingProvider>');
  return ctx;
}
