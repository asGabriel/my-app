import { useState, useMemo } from 'react';
import {
    Tag,
    Space,
    Typography,
    Card,
    DatePicker,
    Select,
    Row,
    Col,
    Statistic,
    Spin,
    Empty,
} from 'antd';
import {
    FilterOutlined,
    CalendarOutlined,
    DollarOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useDebts, useInstallments, Installment } from '../api';
import { formatCurrency } from '../utils/format';
import {
    DebtStatus,
    DEBT_STATUS,
    DEBT_STATUS_OPTIONS,
    DEBT_STATUS_LABELS,
    DEBT_STATUS_COLORS,
    DEBT_CATEGORY_LABELS,
} from '../utils/constants';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface DebtDisplayItem {
    id: string;
    debtId: string;
    description: string;
    identification: string;
    category: string;
    dueDate: string;
    totalAmount: string;
    periodAmount: string;
    paidAmount: string;
    remainingAmount: string;
    status: DebtStatus;
    installmentCount?: number | null;
    installmentId?: number;
    isInstallment: boolean;
}

interface DebtCardProps {
    item: DebtDisplayItem;
}

function DebtCard({ item }: DebtCardProps) {
    const dueDate = dayjs(item.dueDate);
    const isOverdue = dueDate.isBefore(dayjs(), 'day') && item.status !== DEBT_STATUS.SETTLED;
    const periodAmount = parseFloat(item.periodAmount);
    const remainingAmount = parseFloat(item.remainingAmount);

    return (
        <Card
            size="small"
            style={{
                borderLeft: `4px solid ${isOverdue ? '#ff4d4f' : item.status === DEBT_STATUS.SETTLED ? '#52c41a' : '#1890ff'}`,
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Header: Descrição e Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Space wrap size={4}>
                            <Text strong style={{ wordBreak: 'break-word' }}>{item.description}</Text>
                            {item.isInstallment && item.installmentId && (
                                <Tag color="blue" style={{ margin: 0 }}>
                                    {item.installmentId}/{item.installmentCount}
                                </Tag>
                            )}
                        </Space>
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {item.identification}
                            </Text>
                        </div>
                    </div>
                    <Tag color={DEBT_STATUS_COLORS[item.status]} style={{ margin: 0 }}>
                        {DEBT_STATUS_LABELS[item.status]}
                    </Tag>
                </div>

                {/* Info: Categoria e Vencimento */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <Tag style={{ margin: 0 }}>
                        {DEBT_CATEGORY_LABELS[item.category as keyof typeof DEBT_CATEGORY_LABELS] || item.category}
                    </Tag>
                    <Space size={4}>
                        <ClockCircleOutlined style={{ color: isOverdue ? '#ff4d4f' : undefined }} />
                        <Text type={isOverdue ? 'danger' : 'secondary'} style={{ fontSize: 13 }}>
                            {dueDate.format('DD/MM/YYYY')}
                        </Text>
                    </Space>
                </div>

                {/* Valores */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fafafa',
                    padding: '8px 12px',
                    borderRadius: 6,
                    marginTop: 4,
                }}>
                    <div>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Valor</Text>
                        <Text strong style={{ fontSize: 16 }}>
                            {formatCurrency(periodAmount)}
                        </Text>
                    </div>
                    {remainingAmount > 0 && (
                        <div style={{ textAlign: 'right' }}>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>Restante</Text>
                            <Text type="danger" strong style={{ fontSize: 16 }}>
                                {formatCurrency(remainingAmount)}
                            </Text>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

export function DebtList() {
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
        dayjs().startOf('month'),
        dayjs().endOf('month'),
    ]);
    const [statuses, setStatuses] = useState<DebtStatus[]>(['UNPAID', 'PARTIALLY_PAID']);

    const { data: debts, isLoading: isLoadingDebts } = useDebts({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
        statuses,
    });

    const installmentDebtIds = useMemo(() => {
        return debts
            ?.filter(d => d.installmentCount && d.installmentCount >= 1)
            .map(d => d.id) || [];
    }, [debts]);

    const { data: installments, isLoading: isLoadingInstallments } = useInstallments(
        {
            debtIds: installmentDebtIds.length > 0 ? installmentDebtIds : undefined,
            startDate: dateRange[0].format('YYYY-MM-DD'),
            endDate: dateRange[1].format('YYYY-MM-DD'),
        },
        installmentDebtIds.length > 0
    );

    const installmentsByDebtId = useMemo(() => {
        const map = new Map<string, Installment[]>();
        installments?.forEach(inst => {
            const existing = map.get(inst.debtId) || [];
            existing.push(inst);
            map.set(inst.debtId, existing);
        });
        return map;
    }, [installments]);

    const displayItems: DebtDisplayItem[] = useMemo(() => {
        if (!debts) return [];

        const items: DebtDisplayItem[] = [];

        debts.forEach(debt => {
            const isInstallmentDebt = debt.installmentCount && debt.installmentCount >= 1;
            const debtInstallments = installmentsByDebtId.get(debt.id) || [];

            if (isInstallmentDebt) {
                debtInstallments.forEach(inst => {
                    items.push({
                        id: `${debt.id}-${inst.installmentId}`,
                        debtId: debt.id,
                        description: debt.description,
                        identification: debt.identification,
                        category: debt.category,
                        dueDate: inst.dueDate,
                        totalAmount: debt.totalAmount,
                        periodAmount: inst.amount,
                        paidAmount: inst.isPaid ? inst.amount : '0',
                        remainingAmount: inst.isPaid ? '0' : inst.amount,
                        status: inst.isPaid ? DEBT_STATUS.SETTLED : DEBT_STATUS.UNPAID,
                        installmentCount: debt.installmentCount,
                        installmentId: inst.installmentId,
                        isInstallment: true,
                    });
                });
            } else {
                items.push({
                    id: debt.id,
                    debtId: debt.id,
                    description: debt.description,
                    identification: debt.identification,
                    category: debt.category,
                    dueDate: debt.dueDate,
                    totalAmount: debt.totalAmount,
                    periodAmount: debt.totalAmount,
                    paidAmount: debt.paidAmount,
                    remainingAmount: debt.remainingAmount,
                    status: debt.status,
                    installmentCount: debt.installmentCount,
                    isInstallment: false,
                });
            }
        });

        return items.sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());
    }, [debts, installmentsByDebtId]);

    const totals = useMemo(() => {
        return displayItems.reduce(
            (acc, item) => {
                const periodAmount = parseFloat(item.periodAmount);
                const paid = parseFloat(item.paidAmount);
                const remaining = parseFloat(item.remainingAmount);

                return {
                    total: acc.total + periodAmount,
                    paid: acc.paid + paid,
                    remaining: acc.remaining + remaining,
                };
            },
            { total: 0, paid: 0, remaining: 0 }
        );
    }, [displayItems]);

    const isLoading = isLoadingDebts || isLoadingInstallments;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <Title level={3} style={{ marginBottom: 16 }}>
                Contas a Pagar
            </Title>

            {/* Filtros */}
            <Card size="small" style={{ marginBottom: 16 }}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div>
                        <Space size={8} align="center" style={{ marginBottom: 8 }}>
                            <CalendarOutlined />
                            <Text strong>Período</Text>
                        </Space>
                        <RangePicker
                            value={dateRange}
                            onChange={(dates) => {
                                if (dates && dates[0] && dates[1]) {
                                    setDateRange([dates[0], dates[1]]);
                                }
                            }}
                            format="DD/MM/YYYY"
                            allowClear={false}
                            style={{ width: '100%' }}
                            presets={[
                                { label: 'Este mês', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
                                { label: 'Próximo mês', value: [dayjs().add(1, 'month').startOf('month'), dayjs().add(1, 'month').endOf('month')] },
                                { label: 'Últimos 30 dias', value: [dayjs().subtract(30, 'day'), dayjs()] },
                                { label: 'Próximos 30 dias', value: [dayjs(), dayjs().add(30, 'day')] },
                            ]}
                        />
                    </div>
                    <div>
                        <Space size={8} align="center" style={{ marginBottom: 8 }}>
                            <FilterOutlined />
                            <Text strong>Status</Text>
                        </Space>
                        <Select
                            mode="multiple"
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Todos os status"
                            value={statuses}
                            onChange={setStatuses}
                            options={DEBT_STATUS_OPTIONS}
                        />
                    </div>
                </Space>
            </Card>

            {/* Cards de resumo */}
            <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="Total do Período"
                            value={totals.total}
                            precision={2}
                            prefix={<DollarOutlined />}
                            formatter={(value) => formatCurrency(Number(value))}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="Pago"
                            value={totals.paid}
                            precision={2}
                            valueStyle={{ color: '#52c41a' }}
                            formatter={(value) => formatCurrency(Number(value))}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8}>
                    <Card size="small">
                        <Statistic
                            title="Restante"
                            value={totals.remaining}
                            precision={2}
                            valueStyle={{ color: '#ff4d4f' }}
                            formatter={(value) => formatCurrency(Number(value))}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Lista de Cards */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 48 }}>
                    <Spin size="large" />
                </div>
            ) : displayItems.length === 0 ? (
                <Card>
                    <Empty description="Nenhuma conta encontrada no período" />
                </Card>
            ) : (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {displayItems.map(item => (
                        <DebtCard key={item.id} item={item} />
                    ))}

                    {/* Rodapé com totais */}
                    <Card size="small" style={{ background: '#f5f5f5', marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                            <Text strong>{displayItems.length} item(s)</Text>
                            <Space size={24} wrap>
                                <div style={{ textAlign: 'right' }}>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Total</Text>
                                    <Text strong>{formatCurrency(totals.total)}</Text>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Pago</Text>
                                    <Text type="success" strong>{formatCurrency(totals.paid)}</Text>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Restante</Text>
                                    <Text type="danger" strong>{formatCurrency(totals.remaining)}</Text>
                                </div>
                            </Space>
                        </div>
                    </Card>
                </Space>
            )}
        </div>
    );
}
