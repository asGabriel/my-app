import { useMemo, useState } from "react";
import { Card, Collapse, Col, Grid, List, Row, Select, Statistic, Table, Tabs, Tag, theme, Typography } from "antd";
import { useFinancialInstruments } from "../api/hooks/useFinancialInstruments";
import { usePayments } from "../api/hooks/usePayments";
import { FilterBar, FilterBarValues, getDefaultFilters } from "../components/FilterBar";
import { useDebts } from "../api/hooks/useDebts";
import { useIncomes } from "../api/hooks/useIncomes";
import { useInstallments } from "../api/hooks/useInstallments";
import { Loading } from "../components/Loading";
import { formatAmountBr, formatCurrency, formatShortDate } from "../utils/format";

export function AccountMovements() {
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.sm;
  const [filters, setFilters] = useState<FilterBarValues>(getDefaultFilters);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);
  const { data: financialInstruments, isLoading } = useFinancialInstruments();
  const { data: payments, isLoading: isLoadingPayments } = usePayments(
    selectedAccountId
      ? {
        accountIds: [selectedAccountId],
        startDate: filters.startDate,
        endDate: filters.endDate,
      }
      : {},
    !!selectedAccountId
  );
  const { data: incomes, isLoading: isLoadingIncomes } = useIncomes(
    selectedAccountId
      ? {
        financialInstrumentIds: [selectedAccountId],
        startDate: filters.startDate,
        endDate: filters.endDate,
      }
      : {},
    { enabled: !!selectedAccountId }
  );

  const debtIds = useMemo(() => {
    if (!payments) return [];
    return Array.from(new Set(payments.map((payment) => payment.debtId)));
  }, [payments]);
  const { data: debts } = useDebts({ ids: debtIds }, debtIds.length > 0);
  const installmentDebtIds = useMemo(() => {
    if (!debts) return [];
    return debts
      .filter((debt) => debt.installmentCount != null && debt.installmentCount >= 1)
      .map((debt) => debt.id);
  }, [debts]);

  const { data: installments, isLoading: isLoadingInstallments } = useInstallments(
    {
      debtIds: installmentDebtIds,
    },
    installmentDebtIds.length > 0
  );

  const instrumentById = useMemo(() => {
    const map = new Map<string, string>();
    financialInstruments?.forEach((instrument) => {
      map.set(instrument.id, `${instrument.name} (${instrument.owner})`);
    });
    return map;
  }, [financialInstruments]);

  const debtById = useMemo(() => {
    const map = new Map<string, { description: string; identification: string; installmentCount?: number | null; financialInstrumentId?: string | null }>();
    debts?.forEach((debt) => {
      const raw = debt as { financialInstrumentId?: string | null };
      map.set(debt.id, {
        description: debt.description,
        identification: debt.identification,
        installmentCount: debt.installmentCount,
        financialInstrumentId: raw.financialInstrumentId ?? null,
      });
    });
    return map;
  }, [debts]);

  const installmentPayments = useMemo(() => {
    if (!payments || installmentDebtIds.length === 0) return [];
    const installmentDebtIdSet = new Set(installmentDebtIds);
    return payments.filter((payment) => installmentDebtIdSet.has(payment.debtId));
  }, [payments, installmentDebtIds]);

  const paymentIdsInPeriod = useMemo(() => {
    return new Set(installmentPayments.map((payment) => payment.id));
  }, [installmentPayments]);

  const installmentDebtIdSet = useMemo(() => new Set(installmentDebtIds), [installmentDebtIds]);

  const nonInstallmentPaymentsTableData = useMemo(() => {
    if (!payments) return [];
    return payments
      .filter((p) => !installmentDebtIdSet.has(p.debtId))
      .map((payment) => {
        const debt = debtById.get(payment.debtId);
        return {
          key: payment.id,
          description: debt?.description ?? "—",
          identification: debt?.identification ?? "—",
          amount: Number(payment.amount),
          paymentDate: payment.paymentDate,
        };
      })
      .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  }, [payments, installmentDebtIdSet, debtById]);

  const totalEntrada = useMemo(() => {
    if (!incomes) return 0;
    return incomes.reduce((sum, inc) => sum + Number(inc.amount), 0);
  }, [incomes]);

  const totalSaida = useMemo(() => {
    if (!payments) return 0;
    return payments.reduce((sum, p) => sum + Number(p.amount), 0);
  }, [payments]);

  const totalCredito = useMemo(() => {
    return installmentPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  }, [installmentPayments]);

  const quantidadeContasPagas = useMemo(() => {
    if (!payments) return 0;
    return new Set(payments.map((p) => p.debtId)).size;
  }, [payments]);

  const installmentsByDebtId = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        debtId: string;
        installmentId: number;
        dueDate: string;
        amount: string;
        isPaid: boolean;
        paymentId?: string | null;
      }>
    >();
    if (!installments) return map;

    installments.forEach((installment) => {
      const list = map.get(installment.debtId) ?? [];
      list.push(installment);
      map.set(installment.debtId, list);
    });

    map.forEach((list, debtId) => {
      map.set(
        debtId,
        [...list].sort((a, b) => a.installmentId - b.installmentId)
      );
    });

    return map;
  }, [installments]);

  const viewDebtIds = useMemo(() => {
    return installmentDebtIds.filter((debtId) => (debtById.get(debtId)?.installmentCount ?? 0) === 1);
  }, [installmentDebtIds, debtById]);

  const installmentDebtIdsOnly = useMemo(() => {
    return installmentDebtIds.filter((debtId) => (debtById.get(debtId)?.installmentCount ?? 0) > 1);
  }, [installmentDebtIds, debtById]);

  const buildCollapseItems = (debtIds: string[]) =>
    debtIds.map((debtId) => {
      const debt = debtById.get(debtId);
      const debtInstallments = installmentsByDebtId.get(debtId) ?? [];
      const paidInstallmentsInPeriod = debtInstallments.filter(
        (installment) => !!installment.paymentId && paymentIdsInPeriod.has(installment.paymentId)
      );
      const paidAmountInPeriod = paidInstallmentsInPeriod.reduce(
        (sum, installment) => sum + Number(installment.amount),
        0
      );
      const periodReference = `${paidInstallmentsInPeriod.length}/${debtInstallments.length} ${formatAmountBr(paidAmountInPeriod)}`;
      const accountLabel = debt?.financialInstrumentId
        ? instrumentById.get(debt.financialInstrumentId) ?? null
        : null;
      const secondLine = accountLabel ? `${periodReference} · ${accountLabel}` : periodReference;

      return {
        key: debtId,
        styles: {
          header: { padding: isMobile ? "10px 8px" : "12px 16px" },
          body: { padding: isMobile ? "8px 8px" : "12px 16px" },
        },
        label: (
          <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%", minWidth: 0, overflow: "hidden", paddingRight: 4 }}>
            <span
              style={{
                display: "block",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: isMobile ? "calc(100vw - 150px)" : "calc(100vw - 420px)",
              }}
              title={debt?.description ?? "Débito"}
            >
              {debt?.description ?? "Débito"}
            </span>
            <span
              style={{
                fontSize: 12,
                opacity: 0.75,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: isMobile ? "calc(100vw - 150px)" : "calc(100vw - 420px)",
              }}
              title={accountLabel ? `${periodReference} · Conta: ${accountLabel}` : periodReference}
            >
              {secondLine}
            </span>
          </div>
        ),
        children: (
          <List
            size="small"
            dataSource={debtInstallments}
            renderItem={(installment) => {
              const paidInPeriod = !!installment.paymentId && paymentIdsInPeriod.has(installment.paymentId);

              return (
                <List.Item>
                  <div style={{ width: "100%", display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div>Parcela {installment.installmentId}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        {formatShortDate(installment.dueDate)}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <span>{formatAmountBr(Number(installment.amount))}</span>
                      {installment.isPaid ? <Tag color="green">Paga</Tag> : <Tag color="orange">Em aberto</Tag>}
                      {paidInPeriod && <Tag color="blue">Paga no período</Tag>}
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        ),
      };
    });

  const cashCollapseItems = useMemo(
    () => buildCollapseItems(viewDebtIds),
    [viewDebtIds, debtById, installmentsByDebtId, paymentIdsInPeriod, instrumentById]
  );

  const installmentCollapseItems = useMemo(
    () => buildCollapseItems(installmentDebtIdsOnly),
    [installmentDebtIdsOnly, debtById, installmentsByDebtId, paymentIdsInPeriod, instrumentById]
  );

  return (
    <div style={{ padding: isMobile ? 4 : 20 }}>
      <h1 style={{ fontSize: isMobile ? 22 : 28, marginBottom: 12 }}>Extrato</h1>
      <div style={{ marginBottom: 12 }}>
        <FilterBar value={filters} onChange={setFilters} />
      </div>
      <Select
        placeholder="Selecione uma conta"
        allowClear
        loading={isLoading}
        value={selectedAccountId}
        onChange={setSelectedAccountId}
        style={{ width: "100%", maxWidth: isMobile ? "100%" : 360 }}
        options={(financialInstruments ?? []).map((instrument) => ({
          value: instrument.id,
          label: `${instrument.name} (${instrument.owner})`,
        }))}
      />
      {selectedAccountId && (
        <Row gutter={isMobile ? [6, 6] : [12, 12]} style={{ marginTop: isMobile ? 12 : 16 }}>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              hoverable={!isMobile}
              bodyStyle={isMobile ? { padding: "6px 10px" } : undefined}
              style={isMobile ? { fontSize: 12 } : undefined}
            >
              <Loading loading={isLoadingIncomes}>
                <Statistic
                  title={isMobile ? <span style={{ fontSize: 11, fontWeight: 500 }}>Total de entrada</span> : "Total de entrada"}
                  value={totalEntrada}
                  prefix="R$"
                  valueStyle={{ color: token.colorSuccess, ...(isMobile ? { fontSize: 15 } : {}) }}
                  formatter={(value) => formatCurrency(value as number)}
                />
              </Loading>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              hoverable={!isMobile}
              bodyStyle={isMobile ? { padding: "6px 10px" } : undefined}
              style={isMobile ? { fontSize: 12 } : undefined}
            >
              <Loading loading={isLoadingPayments}>
                <Statistic
                  title={isMobile ? <span style={{ fontSize: 11, fontWeight: 500 }}>Total de saída</span> : "Total de saída"}
                  value={totalSaida}
                  prefix="R$"
                  valueStyle={{ color: token.colorError, ...(isMobile ? { fontSize: 15 } : {}) }}
                  formatter={(value) => formatCurrency(value as number)}
                />
              </Loading>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              hoverable={!isMobile}
              bodyStyle={isMobile ? { padding: "6px 10px" } : undefined}
              style={isMobile ? { fontSize: 12 } : undefined}
            >
              <Loading loading={isLoadingPayments}>
                <Statistic
                  title={isMobile ? <span style={{ fontSize: 11, fontWeight: 500 }}>Crédito</span> : "No crédito (parcelados)"}
                  value={totalCredito}
                  prefix="R$"
                  valueStyle={{ color: token.colorWarning, ...(isMobile ? { fontSize: 15 } : {}) }}
                  formatter={(value) => formatCurrency(value as number)}
                />
              </Loading>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card
              size="small"
              hoverable={!isMobile}
              bodyStyle={isMobile ? { padding: "6px 10px" } : undefined}
              style={isMobile ? { fontSize: 12 } : undefined}
            >
              <Loading loading={isLoadingPayments}>
                <Statistic
                  title={isMobile ? <span style={{ fontSize: 11, fontWeight: 500 }}>Contas pagas</span> : "Contas pagas"}
                  value={quantidadeContasPagas}
                  valueStyle={isMobile ? { fontSize: 15 } : undefined}
                />
              </Loading>
            </Card>
          </Col>
        </Row>
      )}
      {selectedAccountId && installmentDebtIds.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Pagamentos parcelados</h3>
          <Tabs
            items={[
              {
                key: "cash",
                label: `À vista (${viewDebtIds.length})`,
                children:
                  cashCollapseItems.length > 0 ? (
                    <div style={{ marginInline: isMobile ? -16 : 0 }}>
                      <Collapse size="small" items={cashCollapseItems} />
                    </div>
                  ) : (
                    <p>Nenhum débito à vista.</p>
                  ),
              },
              {
                key: "installments",
                label: `Parceladas (${installmentDebtIdsOnly.length})`,
                children:
                  installmentCollapseItems.length > 0 ? (
                    <div style={{ marginInline: isMobile ? -16 : 0 }}>
                      <Collapse size="small" items={installmentCollapseItems} />
                    </div>
                  ) : (
                    <p>Nenhum débito parcelado.</p>
                  ),
              },
            ]}
          />
        </div>
      )}

      {selectedAccountId && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 8 }}>Demais pagamentos</h3>
          {nonInstallmentPaymentsTableData.length === 0 ? (
            <p style={{ color: token.colorTextSecondary, margin: 0 }}>Nenhum outro pagamento no período.</p>
          ) : isMobile ? (
            <List
              size="small"
              dataSource={nonInstallmentPaymentsTableData}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: "10px 0",
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ width: "100%" }}>
                    <div style={{ fontWeight: 500, wordBreak: "break-word", marginBottom: 4 }}>{item.description}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: token.colorTextSecondary }}>
                      <span>{formatShortDate(item.paymentDate)}</span>
                      <span style={{ fontWeight: 600 }}>{formatAmountBr(item.amount)}</span>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Table
              size="small"
              dataSource={nonInstallmentPaymentsTableData}
              pagination={false}
              columns={[
                {
                  title: "Descrição",
                  dataIndex: "description",
                  key: "description",
                  ellipsis: true,
                  render: (text: string) => <span title={text}>{text}</span>,
                },
                {
                  title: "Valor",
                  dataIndex: "amount",
                  key: "amount",
                  align: "right",
                  width: 120,
                  render: (value: number) => formatAmountBr(value),
                },
                {
                  title: "Data",
                  dataIndex: "paymentDate",
                  key: "paymentDate",
                  width: 110,
                  render: (date: string) => formatShortDate(date),
                },
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
}