/**
 * Banco em memória do mock de finance. Os dados são gerados relativos a "hoje"
 * para que os chips de mês (-3..+6) sempre tenham lançamentos. Reiniciam a cada
 * reload da página — é só para testar a UI do Controle Mensal.
 */
import dayjs from 'dayjs';
import type {
  Debt, Installment, Recurrence, Income, FinancialInstrument, Payment,
  CreateDebtRequest, CreateRecurrenceRequest, CreatePaymentRequest,
} from './types';

const CLIENT_ID = '00000000-0000-4000-8000-000000000001';
const NOW = dayjs().toISOString();
const FMT = 'YYYY-MM-DD';

let seq = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;
const money = (n: number) => n.toFixed(2);
const monthStart = (offset: number) => dayjs().startOf('month').add(offset, 'month');
const dayIn = (offset: number, day: number) => {
  const base = monthStart(offset);
  return base.date(Math.min(day, base.daysInMonth()));
};

export const CARD_ID = uuid();
export const ACCOUNT_ID = uuid();

export const instruments: FinancialInstrument[] = [
  {
    id: CARD_ID, clientId: CLIENT_ID, name: 'Nubank', owner: 'Gabriel', identification: 'nubank',
    instrumentType: 'CREDIT_CARD', configuration: { defaultDueDate: 10 }, createdAt: NOW,
  },
  {
    id: ACCOUNT_ID, clientId: CLIENT_ID, name: 'Conta Itaú', owner: 'Gabriel', identification: 'itau',
    instrumentType: 'DEBIT_ACCOUNT', configuration: {}, createdAt: NOW,
  },
];

export const debts: Debt[] = [];
export const installments: Installment[] = [];
export const recurrences: Recurrence[] = [];
export const incomes: Income[] = [];
export const payments: Payment[] = [];

function makeDebt(p: {
  description: string; category: string; total: number; paid?: number; due: dayjs.Dayjs;
  expenseType?: 'FIXED' | 'VARIABLE'; installmentCount?: number;
}): Debt {
  const paid = p.paid ?? 0;
  const settled = !p.installmentCount && paid >= p.total - 0.005;
  return {
    id: uuid(), clientId: CLIENT_ID, category: p.category, tags: [],
    identification: p.description.toLowerCase().replace(/\s+/g, '-'),
    description: p.description,
    totalAmount: money(p.total), paidAmount: money(paid), discountAmount: money(0),
    remainingAmount: money(Math.max(0, p.total - paid)),
    dueDate: p.due.format(FMT),
    status: p.installmentCount ? 'INSTALLMENT' : settled ? 'SETTLED' : 'OPEN',
    installmentCount: p.installmentCount ?? null,
    expenseType: p.expenseType,
    createdAt: NOW,
  };
}

/** Cria a dívida parcelada e suas parcelas mensais; `paidCount` já vêm pagas. */
function addInstallmentDebt(description: string, category: string, perInstallment: number, count: number, startOffset: number, day: number) {
  const first = dayIn(startOffset, day);
  const debt = makeDebt({ description, category, total: perInstallment * count, due: first, installmentCount: count });
  let paidCount = 0;
  for (let n = 1; n <= count; n++) {
    const due = dayIn(startOffset + n - 1, day);
    const isPaid = due.isBefore(dayjs(), 'day');
    if (isPaid) paidCount++;
    installments.push({
      debtId: debt.id, installmentId: n, dueDate: due.format(FMT), amount: money(perInstallment),
      isPaid, paymentId: null, createdAt: NOW,
    });
  }
  debt.paidAmount = money(perInstallment * paidCount);
  debt.remainingAmount = money(perInstallment * (count - paidCount));
  debts.push(debt);
}

function seed() {
  // Renda: salário todo mês + um freela de vez em quando.
  for (let o = -12; o <= 0; o++) {
    incomes.push({
      id: uuid(), clientId: CLIENT_ID, financialInstrumentId: ACCOUNT_ID, description: 'Salário',
      amount: money(8500), reference: monthStart(o).format(FMT), createdAt: NOW,
    });
    if (o % 4 === 0) {
      incomes.push({
        id: uuid(), clientId: CLIENT_ID, financialInstrumentId: ACCOUNT_ID, description: 'Freela',
        amount: money(1200), reference: monthStart(o).format(FMT), createdAt: NOW,
      });
    }
  }

  // Recorrências fixas (materializadas como Debt até o mês corrente; meses
  // futuros são projetados pelo monthEngine a partir da regra).
  const fixed: [string, string, number, number][] = [
    ['Aluguel', 'HOME', 1800, 5],
    ['Internet', 'HOME', 120, 12],
    ['Academia', 'HEALTH', 99, 15],
    ['Netflix', 'LIFESTYLE', 55, 20],
  ];
  fixed.forEach(([description, category, amount, day]) => {
    recurrences.push({
      id: uuid(), clientId: CLIENT_ID, financialInstrumentId: ACCOUNT_ID, description, category,
      amount: money(amount), startDate: monthStart(-12).format(FMT), endDate: null, dayOfMonth: day,
      nextRunDate: dayIn(1, day).format(FMT), active: true, createdAt: NOW,
    });
    for (let o = -12; o <= 0; o++) {
      const due = dayIn(o, day);
      const paid = due.isBefore(dayjs(), 'day');
      debts.push(makeDebt({ description, category, total: amount, paid: paid ? amount : 0, due, expenseType: 'FIXED' }));
    }
  });

  // Variáveis avulsas (mercado todo mês, alguns extras).
  for (let o = -6; o <= 0; o++) {
    ([[620 + ((o + 6) % 3) * 80, 8], [340, 22]] as const).forEach(([amount, day]) => {
      const due = dayIn(o, day);
      const paid = due.isBefore(dayjs(), 'day');
      debts.push(makeDebt({ description: 'Mercado', category: 'FOOD', total: amount, paid: paid ? amount : 0, due, expenseType: 'VARIABLE' }));
    });
  }
  debts.push(makeDebt({ description: 'Farmácia', category: 'HEALTH', total: 142.9, paid: 142.9, due: dayIn(0, 3), expenseType: 'VARIABLE' }));
  debts.push(makeDebt({ description: 'Uber', category: 'TRANSPORT', total: 86.5, due: dayIn(0, 28), expenseType: 'VARIABLE' }));
  debts.push(makeDebt({ description: 'Dentista', category: 'HEALTH', total: 380, due: dayIn(1, 9), expenseType: 'VARIABLE' }));

  // Parcelados em vários estágios.
  addInstallmentDebt('Notebook', 'PURCHASES', 450, 12, -4, 10);
  addInstallmentDebt('Celular', 'PURCHASES', 190, 24, -8, 18);
  addInstallmentDebt('Sofá', 'HOME', 320, 6, -2, 25);
  addInstallmentDebt('Curso de inglês', 'EDUCATION', 280, 10, -1, 7);
}

seed();

// --- mutações ---------------------------------------------------------------

export function createDebt(req: CreateDebtRequest): Debt {
  const total = parseFloat(req.totalAmount);
  const count = req.installmentCount && req.installmentCount > 1 ? req.installmentCount : undefined;
  const due = dayjs(req.dueDate);
  const debt = makeDebt({
    description: req.description, category: req.category ?? 'UNKNOWN', total,
    paid: req.isPaid ? total : 0, due, expenseType: req.expenseType, installmentCount: count,
  });
  debts.push(debt);
  if (count) {
    for (let n = 1; n <= count; n++) {
      installments.push({
        debtId: debt.id, installmentId: n, dueDate: due.add(n - 1, 'month').format(FMT),
        amount: money(total / count), isPaid: false, paymentId: null, createdAt: NOW,
      });
    }
  }
  return debt;
}

export function createRecurrence(req: CreateRecurrenceRequest): Recurrence {
  const rec: Recurrence = {
    id: uuid(), clientId: CLIENT_ID, financialInstrumentId: req.financialInstrumentId ?? null,
    description: req.description, category: req.category, amount: req.amount, startDate: req.startDate,
    endDate: req.endDate ?? null, dayOfMonth: req.dayOfMonth, nextRunDate: req.startDate, active: true, createdAt: NOW,
  };
  recurrences.push(rec);
  return rec;
}

export function createPayment(req: CreatePaymentRequest): Payment {
  const debt = debts.find((d) => d.id === req.debtId);
  if (!debt) throw new Error('Débito não encontrado');

  const inst = installments
    .filter((i) => i.debtId === debt.id && !i.isPaid)
    .sort((a, b) => a.installmentId - b.installmentId)
    .find((i) => dayjs(i.dueDate).isSame(dayjs(req.paymentDate), 'month')) ??
    installments.filter((i) => i.debtId === debt.id && !i.isPaid).sort((a, b) => a.installmentId - b.installmentId)[0];

  const amount = req.amount ? parseFloat(req.amount) : inst ? parseFloat(inst.amount) : parseFloat(debt.remainingAmount);
  const payment: Payment = {
    id: uuid(), clientId: CLIENT_ID, debtId: debt.id, accountId: req.financialInstrumentId ?? ACCOUNT_ID,
    financialInstrumentId: req.financialInstrumentId ?? null, amount: money(amount),
    paymentDate: req.paymentDate, createdAt: NOW,
  };
  payments.push(payment);

  const paid = parseFloat(debt.paidAmount) + amount;
  debt.paidAmount = money(paid);
  debt.remainingAmount = money(Math.max(0, parseFloat(debt.totalAmount) - paid));
  if (inst) {
    // Parcela só quita se o valor cobre a parcela inteira (pagamento parcial não a marca).
    if (amount >= parseFloat(inst.amount) - 0.005) {
      inst.isPaid = true;
      inst.paymentId = payment.id;
    }
    if (installments.filter((i) => i.debtId === debt.id).every((i) => i.isPaid)) debt.status = 'SETTLED';
  } else if (paid >= parseFloat(debt.totalAmount) - 0.005) {
    debt.status = 'SETTLED';
  }
  return payment;
}
