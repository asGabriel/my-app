import { useMemo, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, theme, Progress } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useIncomes, usePayments, useDebts, useInstallments, type Debt } from '../api';
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

    const { data: payments, isLoading: isLoadingPayments } = usePayments({
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
        isPaid: false,
    });

    const debtsMap = useMemo(() => {
        if (!debts) return new Map<string, Debt>();
        return new Map(debts.map((debt) => [debt.id, debt]));
    }, [debts]);

    const totalIncome = useMemo(() => {
        if (!incomes) return 0;
        return incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
    }, [incomes]);

    const totalPayments = useMemo(() => {
        if (!payments) return 0;
        return payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    }, [payments]);

    const pendingDebtsTotal = useMemo(() => {
        let total = 0;
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        if (installments && installments.length > 0) {
            total += installments
                .filter(inst => {
                    const due = new Date(inst.dueDate);
                    return due >= start && due <= end && !inst.isPaid;
                })
                .reduce((sum, inst) => sum + parseFloat(inst.amount), 0);
        }
        if (debts) {
            debts
                .filter(debt => {
                    if (debt.status !== 'OPEN') return false;
                    const hasInstallments = debt.installmentCount != null && debt.installmentCount >= 1;
                    if (hasInstallments) return false;
                    const due = new Date(debt.dueDate);
                    return due >= start && due <= end;
                })
                .forEach(debt => {
                    total += parseFloat(debt.remainingAmount);
                });
        }
        return total;
    }, [debts, installments, filters.startDate, filters.endDate]);

    // Mesmo princípio do "Contas a Pagar": parcelas do período (categoria = débito pai) + débitos OPEN sem parcelas
    const categoryDistribution = useMemo(() => {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        const categoryTotals = new Map<string, number>();
        let grandTotal = 0;

        if (installments && debtsMap.size > 0) {
            installments
                .filter(inst => {
                    const due = new Date(inst.dueDate);
                    return due >= start && due <= end && !inst.isPaid;
                })
                .forEach(inst => {
                    const parentDebt = debtsMap.get(inst.debtId);
                    const category = (parentDebt?.category || 'UNKNOWN') as DebtCategory;
                    const amount = parseFloat(inst.amount);
                    categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
                    grandTotal += amount;
                });
        }

        if (debts) {
            debts
                .filter(debt => {
                    if (debt.status !== 'OPEN') return false;
                    const hasInstallments = debt.installmentCount != null && debt.installmentCount >= 1;
                    if (hasInstallments) return false;
                    const due = new Date(debt.dueDate);
                    return due >= start && due <= end;
                })
                .forEach(debt => {
                    const category = (debt.category || 'UNKNOWN') as DebtCategory;
                    const amount = parseFloat(debt.remainingAmount);
                    categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
                    grandTotal += amount;
                });
        }

        return Array.from(categoryTotals.entries())
            .map(([category, total]) => ({
                category: category as DebtCategory,
                total,
                percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
                color: CATEGORY_COLORS[category as DebtCategory] || CATEGORY_COLORS.UNKNOWN,
            }))
            .sort((a, b) => b.total - a.total);
    }, [debts, installments, debtsMap, filters.startDate, filters.endDate]);

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
                                    title="Entradas"
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
                                    value={totalPayments}
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
                                    value={pendingDebtsTotal}
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
                                    value={totalIncome - totalPayments}
                                    prefix="R$"
                                    valueStyle={{ color: totalIncome - totalPayments >= 0 ? token.colorSuccess : token.colorError }}
                                    formatter={(value) => formatCurrency(value as number)}
                                />
                            </Loading>
                        </Card>
                    </Col>

                </Row>

                <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                    <Col xs={24}>
                        <Card title="Distribuição por Categoria" size="small">
                            <Loading loading={isLoadingDebts || isLoadingInstallments}>
                                {categoryDistribution.length === 0 ? (
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        Nenhum débito no período
                                    </Text>
                                ) : (
                                    <Row gutter={[16, 12]}>
                                        {categoryDistribution.map(({ category, total, percentage, color }) => (
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
                                                    <Progress
                                                        percent={percentage}
                                                        showInfo={false}
                                                        strokeColor={color}
                                                        size="small"
                                                    />
                                                    <Text style={{ fontSize: 12, color }}>
                                                        R$ {formatCurrency(total)}
                                                    </Text>
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
