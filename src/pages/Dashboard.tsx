import { useMemo, useState } from 'react';
import { Card, Col, Row, Statistic, Progress, Typography, Space, theme } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useIncomes, usePayments } from '../api';
import { FilterBar, FilterBarValues, getDefaultFilters } from '../components/FilterBar';
import { Loading } from '../components/Loading';
import { formatCurrency } from '../utils/format';

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

    const totalIncome = useMemo(() => {
        if (!incomes) return 0;
        return incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
    }, [incomes]);

    const totalPayments = useMemo(() => {
        if (!payments) return 0;
        return payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    }, [payments]);

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
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                                {[
                                    { time: 'Agora', text: 'Novo usuário registrado' },
                                    { time: '5 min', text: 'Venda #1234 realizada' },
                                    { time: '15 min', text: 'Produto atualizado' },
                                    { time: '1h', text: 'Relatório exportado' },
                                ].map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex-between"
                                        style={{
                                            padding: '6px 0',
                                            borderBottom: index < 3 ? `1px solid ${token.colorBorderSecondary}` : 'none',
                                        }}
                                    >
                                        <Text style={{ fontSize: 13 }}>{item.text}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                                    </div>
                                ))}
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
