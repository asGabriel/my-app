import { useMemo, useState } from 'react';
import { Card, Col, Row, Statistic, Progress, Typography, Space, theme } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useIncomes, usePayments, useDebts, Debt } from '../api';
import { FilterBar, FilterBarValues, getDefaultFilters } from '../components/FilterBar';
import { Loading } from '../components/Loading';
import { formatCurrency, formatRelativeTime } from '../utils/format';

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

    const recentActivities = useMemo(() => {
        const activities: Array<{
            id: string;
            type: 'payment' | 'debt';
            label: string;
            description: string;
            amount: number;
            createdAt: string;
        }> = [];

        if (payments) {
            payments.forEach((payment) => {
                const debt = debtsMap.get(payment.debtId);
                activities.push({
                    id: payment.id,
                    type: 'payment',
                    label: 'Pagamento',
                    description: debt?.description || '',
                    amount: parseFloat(payment.amount),
                    createdAt: payment.createdAt,
                });
            });
        }

        return activities
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10);
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
                        <Card title="Metas do Mês" size="small">
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                <div>
                                    <div className="flex-between" style={{ marginBottom: 4 }}>
                                        <Text style={{ fontSize: 13 }}>Vendas</Text>
                                        <Text type="secondary" style={{ fontSize: 13 }}>75%</Text>
                                    </div>
                                    <Progress percent={75} status="active" strokeColor={token.colorPrimary} size="small" />
                                </div>
                                <div>
                                    <div className="flex-between" style={{ marginBottom: 4 }}>
                                        <Text style={{ fontSize: 13 }}>Novos Clientes</Text>
                                        <Text type="secondary" style={{ fontSize: 13 }}>60%</Text>
                                    </div>
                                    <Progress percent={60} status="active" strokeColor={token.colorSuccess} size="small" />
                                </div>
                                <div>
                                    <div className="flex-between" style={{ marginBottom: 4 }}>
                                        <Text style={{ fontSize: 13 }}>Entradas</Text>
                                        <Text type="secondary" style={{ fontSize: 13 }}>90%</Text>
                                    </div>
                                    <Progress percent={90} status="active" strokeColor={token.purple} size="small" />
                                </div>
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card title="Atividade Recente" size="small">
                            <Loading loading={isLoadingPayments || isLoadingDebts}>
                                {recentActivities.length === 0 ? (
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        Nenhuma atividade no período
                                    </Text>
                                ) : (
                                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                                        {recentActivities.map((activity, index) => (
                                            <div
                                                key={activity.id}
                                                style={{
                                                    padding: '8px 0',
                                                    borderBottom: index < recentActivities.length - 1
                                                        ? `1px solid ${token.colorBorderSecondary}`
                                                        : 'none',
                                                }}
                                            >
                                                <div className="flex-between">
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <Text
                                                            strong
                                                            style={{
                                                                fontSize: 12,
                                                                color: activity.type === 'payment' ? token.colorError : token.colorWarning,
                                                            }}
                                                        >
                                                            {activity.label}
                                                        </Text>
                                                        {activity.description && (
                                                            <Text
                                                                style={{ fontSize: 13, display: 'block' }}
                                                                className="text-truncate"
                                                            >
                                                                {activity.description}
                                                            </Text>
                                                        )}
                                                    </div>
                                                    <div style={{ textAlign: 'right', marginLeft: 8 }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 13,
                                                                color: activity.type === 'payment' ? token.colorError : token.colorWarning,
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            {activity.type === 'payment' ? '-' : '+'}R$ {formatCurrency(activity.amount)}
                                                        </Text>
                                                        <Text
                                                            type="secondary"
                                                            style={{ fontSize: 11, display: 'block' }}
                                                        >
                                                            {formatRelativeTime(activity.createdAt)}
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
