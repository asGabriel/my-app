import { useMemo, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Space, theme } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useIncomes, usePayments, useDebts, Debt } from '../api';
import { FilterBar, FilterBarValues, getDefaultFilters } from '../components/FilterBar';
import { Loading } from '../components/Loading';
import { formatCurrency, formatRelativeTime } from '../utils/format';
import { formatDebtStatus, DEBT_STATUS_COLORS, DebtStatus } from '../utils/constants';

const { Title, Text } = Typography;

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

    const recentDebts = useMemo(() => {
        if (!debts) return [];
        return [...debts]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [debts]);

    const recentPayments = useMemo(() => {
        if (!payments) return [];
        return [...payments]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((payment) => ({
                ...payment,
                debt: debtsMap.get(payment.debtId),
            }));
    }, [payments, debtsMap]);

    return (
        <div style={{ margin: -16 }}>
            <div
                className="page-header"
                style={{
                    background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                }}
            >
                <Title level={4} className="page-header__title" style={{ color: token.colorWhite }}>
                    Dashboard
                </Title>
                <Text className="page-header__subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Visão geral das suas finanças
                </Text>
            </div>

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

                </Row>

                <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                    <Col xs={24} lg={12}>
                        <Card title="Últimos Débitos" size="small">
                            <Loading loading={isLoadingDebts}>
                                {recentDebts.length === 0 ? (
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        Nenhum débito no período
                                    </Text>
                                ) : (
                                    <Space direction="vertical" style={{ width: '100%' }} size={4}>
                                        {recentDebts.map((debt, index) => (
                                            <div
                                                key={debt.id}
                                                style={{
                                                    padding: '8px 0',
                                                    borderBottom: index < recentDebts.length - 1
                                                        ? `1px solid ${token.colorBorderSecondary}`
                                                        : 'none',
                                                }}
                                            >
                                                <div className="flex-between">
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <Text
                                                            strong
                                                            style={{ fontSize: 13 }}
                                                            className="text-truncate"
                                                        >
                                                            {debt.description}
                                                        </Text>
                                                        <div style={{ marginTop: 2 }}>
                                                            <Text
                                                                style={{
                                                                    fontSize: 11,
                                                                    padding: '1px 6px',
                                                                    borderRadius: 4,
                                                                    background: DEBT_STATUS_COLORS[debt.status as DebtStatus] === 'success'
                                                                        ? token.colorSuccessBg
                                                                        : DEBT_STATUS_COLORS[debt.status as DebtStatus] === 'warning'
                                                                            ? token.colorWarningBg
                                                                            : token.colorInfoBg,
                                                                    color: DEBT_STATUS_COLORS[debt.status as DebtStatus] === 'success'
                                                                        ? token.colorSuccess
                                                                        : DEBT_STATUS_COLORS[debt.status as DebtStatus] === 'warning'
                                                                            ? token.colorWarning
                                                                            : token.colorInfo,
                                                                }}
                                                            >
                                                                {formatDebtStatus(debt.status as DebtStatus)}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right', marginLeft: 8 }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 13,
                                                                color: token.colorWarning,
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            R$ {formatCurrency(parseFloat(debt.totalAmount))}
                                                        </Text>
                                                        <Text
                                                            type="secondary"
                                                            style={{ fontSize: 11, display: 'block' }}
                                                        >
                                                            {formatRelativeTime(debt.createdAt)}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </Space>
                                )}
                            </Loading>
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card title="Últimos Pagamentos" size="small">
                            <Loading loading={isLoadingPayments}>
                                {recentPayments.length === 0 ? (
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        Nenhum pagamento no período
                                    </Text>
                                ) : (
                                    <Space direction="vertical" style={{ width: '100%' }} size={4}>
                                        {recentPayments.map((payment, index) => (
                                            <div
                                                key={payment.id}
                                                style={{
                                                    padding: '8px 0',
                                                    borderBottom: index < recentPayments.length - 1
                                                        ? `1px solid ${token.colorBorderSecondary}`
                                                        : 'none',
                                                }}
                                            >
                                                <div className="flex-between">
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <Text
                                                            strong
                                                            style={{ fontSize: 13 }}
                                                            className="text-truncate"
                                                        >
                                                            {payment.debt?.description || 'Pagamento'}
                                                        </Text>
                                                        {payment.debt && (
                                                            <Text
                                                                type="secondary"
                                                                style={{ fontSize: 11, display: 'block' }}
                                                                className="text-truncate"
                                                            >
                                                                {payment.debt.identification}
                                                            </Text>
                                                        )}
                                                    </div>
                                                    <div style={{ textAlign: 'right', marginLeft: 8 }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 13,
                                                                color: token.colorError,
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            -R$ {formatCurrency(parseFloat(payment.amount))}
                                                        </Text>
                                                        <Text
                                                            type="secondary"
                                                            style={{ fontSize: 11, display: 'block' }}
                                                        >
                                                            {formatRelativeTime(payment.createdAt)}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </Space>
                                )}
                            </Loading>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
