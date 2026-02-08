import { useMemo, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, theme } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useIncomes, useDebts, useInstallments, usePayments, type Debt } from '../api';
import { FilterBar, FilterBarValues, getDefaultFilters } from '../components/FilterBar';
import { Loading } from '../components/Loading';
import { formatCurrency } from '../utils/format';
import { DEBT_CATEGORY_LABELS, DebtCategory } from '../utils/constants';

const CATEGORY_COLORS: Record<DebtCategory, string> = {
    HOME: '#1890ff',
    TRANSPORT: '#52c41a',
    HEALTH: '#eb2f96',
    FOOD: '#fa8c16',
    LIFESTYLE: '#722ed1',
    EDUCATION: '#13c2c2',
    GOALS: '#2f54eb',
    PERSONAL: '#faad14',
    UNKNOWN: '#8c8c8c',
};

const { Text } = Typography;

export function Dashboard() {
    const { token } = theme.useToken();
    const [filters, setFilters] = useState<FilterBarValues>(getDefaultFilters);

    const { data: incomes, isLoading: isLoadingIncomes } = useIncomes({
        startDate: filters.startDate,
        endDate: filters.endDate,
    });

    const { data: debts, isLoading: isLoadingDebts } = useDebts({
        startDate: filters.startDate,
        endDate: filters.endDate,
    });

    const { data: installments, isLoading: isLoadingInstallments } = useInstallments({
        startDate: filters.startDate,
        endDate: filters.endDate,
    });

    const { data: payments, isLoading: isLoadingPayments } = usePayments({
        startDate: filters.startDate,
        endDate: filters.endDate,
    });

    const totalIncome = useMemo(() => {
        if (!incomes) return 0;
        return incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
    }, [incomes]);
    const totalPaid = useMemo(() => {
        if (!payments) return 0;
        return payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    }, [payments]);
    
    // Contas a Pagar:
    // - débitos sem installmentCount e status != SETTLED: soma remainingAmount
    // - installments não pagas: soma amount
    const totalPending = useMemo(() => {
        let pendingDebts = 0;
        let pendingInstallments = 0;

        if (debts) {
            debts
                .filter(debt => debt.installmentCount == null && debt.status !== 'SETTLED')
                .forEach(debt => {
                    pendingDebts += parseFloat(debt.remainingAmount);
                });
        }

        if (installments) {
            installments
                .filter(inst => !inst.isPaid)
                .forEach(inst => {
                    pendingInstallments += parseFloat(inst.amount);
                });
        }
        return pendingDebts + pendingInstallments;
    }, [debts, installments]);

    const debtsMap = useMemo(() => {
        if (!debts) return new Map<string, Debt>();
        return new Map(debts.map(debt => [debt.id, debt]));
    }, [debts]);

    const categoryDistribution = useMemo(() => {
        const categoryData = new Map<string, { paid: number; unpaid: number }>();
        let grandTotal = 0;

        // PAID: payments do período agrupados por categoria do débito
        if (payments && debtsMap.size > 0) {
            payments.forEach(payment => {
                const debt = debtsMap.get(payment.debtId);
                const category = (debt?.category || 'UNKNOWN') as DebtCategory;
                const amount = parseFloat(payment.amount);
                
                const current = categoryData.get(category) || { paid: 0, unpaid: 0 };
                current.paid += amount;
                categoryData.set(category, current);
                grandTotal += amount;
            });
        }

        // UNPAID: débitos sem installmentCount e não quitados (remainingAmount)
        if (debts) {
            debts
                .filter(debt => debt.installmentCount == null && debt.status !== 'SETTLED')
                .forEach(debt => {
                    const category = (debt.category || 'UNKNOWN') as DebtCategory;
                    const unpaidAmount = parseFloat(debt.remainingAmount);
                    
                    const current = categoryData.get(category) || { paid: 0, unpaid: 0 };
                    current.unpaid += unpaidAmount;
                    categoryData.set(category, current);
                    grandTotal += unpaidAmount;
                });
        }

        // UNPAID: installments não pagas
        if (installments && debtsMap.size > 0) {
            installments
                .filter(inst => !inst.isPaid)
                .forEach(inst => {
                    const parentDebt = debtsMap.get(inst.debtId);
                    const category = (parentDebt?.category || 'UNKNOWN') as DebtCategory;
                    const amount = parseFloat(inst.amount);
                    
                    const current = categoryData.get(category) || { paid: 0, unpaid: 0 };
                    current.unpaid += amount;
                    categoryData.set(category, current);
                    grandTotal += amount;
                });
        }

        return Array.from(categoryData.entries())
            .map(([category, { paid, unpaid }]) => {
                const total = paid + unpaid;
                return {
                    category: category as DebtCategory,
                    total,
                    paid,
                    unpaid,
                    percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
                    paidPercentage: total > 0 ? (paid / total) * 100 : 0,
                    color: CATEGORY_COLORS[category as DebtCategory] || CATEGORY_COLORS.UNKNOWN,
                };
            })
            .sort((a, b) => b.total - a.total);
    }, [debts, installments, payments, debtsMap]);

    return (
        <div style={{ margin: -16 }}>
            <div
                className="filter-section"
                style={{
                    background: token.colorBgContainer,
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                }}
            >
                <div className="filter-section__label">
                    <FilterOutlined style={{ color: token.colorTextSecondary }} />
                    <Text strong style={{ color: token.colorTextSecondary }}>
                        Filtros
                    </Text>
                </div>
                <FilterBar value={filters} onChange={setFilters} />
            </div>

            <div className="page-content">
                <Row gutter={[12, 12]} className="stats-grid">

                    <Col xs={12} sm={12} lg={6}>
                        <Card size="small" hoverable className="stats-card">
                            <Loading loading={isLoadingIncomes}>
                                <Statistic
                                    title="Receita"
                                    value={totalIncome}
                                    prefix="R$"
                                    valueStyle={{ color: token.colorSuccess }}
                                    formatter={(value) => formatCurrency(value as number)}
                                />
                            </Loading>
                        </Card>
                    </Col>

                    <Col xs={12} sm={12} lg={6}>
                        <Card size="small" hoverable className="stats-card">
                            <Loading loading={isLoadingPayments}>
                                <Statistic
                                    title="Saídas"
                                    value={totalPaid}
                                    prefix="R$"
                                    valueStyle={{ color: token.colorError }}
                                    formatter={(value) => formatCurrency(value as number)}
                                />
                            </Loading>
                        </Card>
                    </Col>

                    <Col xs={12} sm={12} lg={6}>
                        <Card size="small" hoverable className="stats-card">
                            <Loading loading={isLoadingDebts || isLoadingInstallments}>
                                <Statistic
                                    title="Contas a Pagar"
                                    value={totalPending}
                                    prefix="R$"
                                    valueStyle={{ color: token.colorWarning }}
                                    formatter={(value) => formatCurrency(value as number)}
                                />
                            </Loading>
                        </Card>
                    </Col>

                    <Col xs={12} sm={12} lg={6}>
                        <Card size="small" hoverable className="stats-card">
                            <Loading loading={isLoadingIncomes || isLoadingPayments}>
                                <Statistic
                                    title="Saldo"
                                    value={totalIncome - totalPaid}
                                    prefix="R$"
                                    valueStyle={{ color: totalIncome - totalPaid >= 0 ? token.colorSuccess : token.colorError }}
                                    formatter={(value) => formatCurrency(value as number)}
                                />
                            </Loading>
                        </Card>
                    </Col>

                </Row>

                <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                    <Col xs={24}>
                        <Card title="Distribuição por Categoria" size="small">
                            <Loading loading={isLoadingDebts || isLoadingInstallments || isLoadingPayments}>
                                {categoryDistribution.length === 0 ? (
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        Nenhum débito no período
                                    </Text>
                                ) : (
                                    <Row gutter={[16, 12]}>
                                        {categoryDistribution.map(({ category, total, paid, unpaid, percentage, paidPercentage, color }) => (
                                            <Col xs={24} sm={12} lg={8} xl={6} key={category}>
                                                <div style={{ marginBottom: 4 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <Text strong style={{ fontSize: 13 }}>
                                                            {DEBT_CATEGORY_LABELS[category] || category}
                                                        </Text>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                            {percentage.toFixed(1)}%
                                                        </Text>
                                                    </div>
                                                    {/* Barra customizada com duas seções: pago (forte) e não pago (fraco) */}
                                                    <div
                                                        style={{
                                                            width: `${percentage}%`,
                                                            minWidth: percentage > 0 ? 20 : 0,
                                                            height: 8,
                                                            borderRadius: 4,
                                                            background: `${color}40`, // Cor fraca (não pago) - 25% opacidade
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: `${paidPercentage}%`,
                                                                height: '100%',
                                                                background: color, // Cor forte (pago)
                                                                borderRadius: paidPercentage < 100 ? '4px 0 0 4px' : 4,
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                                        <Text style={{ fontSize: 12, color }}>
                                                            R$ {formatCurrency(total)}
                                                        </Text>
                                                        <Text style={{ fontSize: 11, color: token.colorTextSecondary }}>
                                                            {paid > 0 && unpaid > 0 ? (
                                                                <>
                                                                    <span style={{ color }}>✓ {formatCurrency(paid)}</span>
                                                                    {' / '}
                                                                    <span style={{ opacity: 0.6 }}>◷ {formatCurrency(unpaid)}</span>
                                                                </>
                                                            ) : paid > 0 ? (
                                                                <span style={{ color: token.colorSuccess }}>✓ Pago</span>
                                                            ) : (
                                                                <span style={{ opacity: 0.6 }}>◷ Em aberto</span>
                                                            )}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </Loading>
                        </Card>
                    </Col>
                </Row>

            </div>
        </div>
    );
}
