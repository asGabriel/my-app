import { useState, useMemo } from 'react';
import {
    Tag,
    Space,
    Typography,
    Card,
    Tabs,
    Spin,
    Empty,
    Select,
} from 'antd';
import {
    FilterOutlined,
    EditOutlined,
    CalendarOutlined,
    UnorderedListOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useDebts, useInstallments, Debt } from '../api';
import { formatCurrency } from '../utils/format';
import {
    DebtStatus,
    DEBT_STATUS,
    DEBT_STATUS_LABELS,
    DEBT_STATUS_COLORS,
    DEBT_CATEGORY_LABELS,
    DEBT_CATEGORY_OPTIONS,
    EXPENSE_TYPE_LABELS,
} from '../utils/constants';
import { DebtEditModal } from '../components/DebtEditModal';
import { FilterBar, FilterBarValues, getDefaultFilters } from '../components/FilterBar';
import { theme } from 'antd';

const { Title, Text } = Typography;

type TabKey = 'open' | 'paid';

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
    expenseType?: string | null;
    installmentCount?: number | null;
    installmentId?: number;
    isInstallment: boolean;
}

interface DebtCardProps {
    item: DebtDisplayItem;
    onClick?: () => void;
}

function DebtCard({ item, onClick }: DebtCardProps) {
    const dueDate = dayjs(item.dueDate);
    const isOverdue = dueDate.isBefore(dayjs(), 'day') && item.status !== DEBT_STATUS.SETTLED;
    const periodAmount = parseFloat(item.periodAmount);
    const remainingAmount = parseFloat(item.remainingAmount);

    return (
        <Card
            size="small"
            hoverable={!!onClick}
            onClick={onClick}
            style={{
                borderLeft: `4px solid ${isOverdue ? '#ff4d4f' : item.status === DEBT_STATUS.SETTLED ? '#52c41a' : '#1890ff'}`,
                cursor: onClick ? 'pointer' : 'default',
            }}
            styles={{ body: { padding: '10px 12px' } }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Space wrap size={4} style={{ marginBottom: 2 }}>
                            <Text strong style={{ wordBreak: 'break-word', fontSize: 13 }}>{item.description}</Text>
                            <Tag style={{ margin: 0, fontSize: 11 }}>
                                {DEBT_CATEGORY_LABELS[item.category as keyof typeof DEBT_CATEGORY_LABELS] || item.category}
                            </Tag>
                            {item.isInstallment && item.installmentId && (
                                <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                                    {item.installmentId}/{item.installmentCount}
                                </Tag>
                            )}
                            {item.expenseType && (
                                <Tag color={item.expenseType === 'FIXED' ? 'purple' : 'cyan'} style={{ margin: 0, fontSize: 11 }}>
                                    {EXPENSE_TYPE_LABELS[item.expenseType as keyof typeof EXPENSE_TYPE_LABELS] || item.expenseType}
                                </Tag>
                            )}
                            {onClick && (
                                <EditOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                            )}
                        </Space>
                        <Text type="secondary" style={{ fontSize: 11 }}>{item.identification}</Text>
                    </div>
                    <Tag color={DEBT_STATUS_COLORS[item.status as DebtStatus] ?? 'default'} style={{ margin: 0, fontSize: 11 }}>
                        {DEBT_STATUS_LABELS[item.status as DebtStatus] ?? item.status}
                    </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Space size={4}>
                        <CalendarOutlined style={{ fontSize: 12, color: isOverdue ? '#ff4d4f' : undefined }} />
                        <Text type={isOverdue ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
                            {dueDate.format('DD/MM')}
                        </Text>
                    </Space>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                        <span>
                            <Text type="secondary" style={{ fontSize: 10 }}>Valor </Text>
                            <Text strong style={{ fontSize: 14 }}>{formatCurrency(periodAmount)}</Text>
                        </span>
                        {remainingAmount > 0 && (
                            <span>
                                <Text type="secondary" style={{ fontSize: 10 }}>Restante </Text>
                                <Text type="danger" strong style={{ fontSize: 14 }}>{formatCurrency(remainingAmount)}</Text>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

const STATUS_TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'open', label: 'Em Aberto', icon: <ClockCircleOutlined /> },
    { key: 'paid', label: 'Pagas', icon: <CheckCircleOutlined /> },
];

const DUE_SOON_DAYS = 7;

type QuickFilterKey = 'due_soon' | 'installment' | null;

export function DebtList() {
    const { token } = theme.useToken();
    const [filters, setFilters] = useState<FilterBarValues>(getDefaultFilters);
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [quickFilter, setQuickFilter] = useState<QuickFilterKey>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

    // Busca débitos não parcelados do período
    const { data: debts, isLoading: isLoadingDebts } = useDebts({
        startDate: filters.startDate,
        endDate: filters.endDate,
    });

    // Busca todas as parcelas do período (independente do dueDate do débito pai)
    const { data: installments, isLoading: isLoadingInstallments } = useInstallments({
        startDate: filters.startDate,
        endDate: filters.endDate,
    });

    // Coleta os debtIds das parcelas para buscar os débitos pai
    const installmentDebtIds = useMemo(() => {
        if (!installments) return [];
        const ids = new Set<string>();
        installments.forEach(inst => ids.add(inst.debtId));
        return Array.from(ids);
    }, [installments]);

    // Busca os débitos pai das parcelas (podem ter dueDate fora do período)
    const { data: parentDebts, isLoading: isLoadingParentDebts } = useDebts(
        { ids: installmentDebtIds },
        installmentDebtIds.length > 0
    );

    // Combina todos os débitos em um mapa
    const allDebtsById = useMemo(() => {
        const map = new Map<string, Debt>();
        debts?.forEach(debt => map.set(debt.id, debt));
        parentDebts?.forEach(debt => map.set(debt.id, debt));
        return map;
    }, [debts, parentDebts]);

    const handleCardClick = (debtId: string) => {
        const debt = allDebtsById.get(debtId);
        if (debt) {
            setSelectedDebt(debt);
            setEditModalOpen(true);
        }
    };

    const handleEditModalClose = () => {
        setEditModalOpen(false);
        setSelectedDebt(null);
    };

    const displayItems: DebtDisplayItem[] = useMemo(() => {
        const items: DebtDisplayItem[] = [];

        // Primeiro, processa as parcelas do período
        installments?.forEach(inst => {
            const debt = allDebtsById.get(inst.debtId);
            if (!debt) return;

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
                status: inst.isPaid ? DEBT_STATUS.SETTLED : DEBT_STATUS.OPEN,
                expenseType: debt.expenseType ?? null,
                installmentCount: debt.installmentCount,
                installmentId: inst.installmentId,
                isInstallment: true,
            });
        });

        // Depois, processa os débitos não parcelados do período
        debts?.forEach(debt => {
            // Pula débitos parcelados (já foram processados pelas parcelas)
            if (debt.installmentCount && debt.installmentCount >= 1) return;

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
                expenseType: debt.expenseType ?? null,
                installmentCount: debt.installmentCount,
                isInstallment: false,
            });
        });

        return items.sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());
    }, [debts, installments, allDebtsById]);

    const filteredDisplayItems = useMemo(() => {
        let result = displayItems;
        if (categoryFilter.length > 0) {
            const set = new Set(categoryFilter);
            result = result.filter(item => set.has(item.category || 'UNKNOWN'));
        }
        if (!quickFilter) return result;
        const today = dayjs().startOf('day');
        if (quickFilter === 'due_soon') {
            const limit = today.add(DUE_SOON_DAYS, 'day');
            return result.filter(item => {
                const due = dayjs(item.dueDate).startOf('day');
                return (
                    item.status !== DEBT_STATUS.SETTLED &&
                    !due.isBefore(today) &&
                    !due.isAfter(limit)
                );
            });
        }
        if (quickFilter === 'installment') {
            return result.filter(item => item.isInstallment);
        }
        return result;
    }, [displayItems, quickFilter, categoryFilter]);

    const itemsByTab = useMemo(() => {
        const map = new Map<TabKey, DebtDisplayItem[]>();
        STATUS_TABS.forEach(({ key }) => map.set(key, []));
        filteredDisplayItems.forEach(item => {
            const tabKey: TabKey = item.status === DEBT_STATUS.SETTLED ? 'paid' : 'open';
            const list = map.get(tabKey);
            if (list) list.push(item);
        });
        return map;
    }, [filteredDisplayItems]);

    const dueSoonCount = useMemo(() => {
        const today = dayjs().startOf('day');
        const limit = today.add(DUE_SOON_DAYS, 'day');
        return displayItems.filter(item => {
            if (item.status === DEBT_STATUS.SETTLED) return false;
            const due = dayjs(item.dueDate).startOf('day');
            return !due.isBefore(today) && !due.isAfter(limit);
        }).length;
    }, [displayItems]);

    const installmentCount = useMemo(
        () => displayItems.filter(item => item.isInstallment).length,
        [displayItems]
    );

    const isLoading = isLoadingDebts || isLoadingInstallments || isLoadingParentDebts;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div
                className="filter-section"
                style={{
                    background: token.colorBgContainer,
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    margin: -24,
                    marginBottom: 24,
                    padding: 16,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 16,
                        rowGap: 12,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FilterOutlined style={{ color: token.colorTextSecondary, fontSize: 14 }} />
                        <Text strong style={{ color: token.colorTextSecondary, fontSize: 14, margin: 0 }}>
                            Filtros
                        </Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', minHeight: 32 }}>
                        <FilterBar value={filters} onChange={setFilters} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}>
                        <Text type="secondary" style={{ fontSize: 14, margin: 0, lineHeight: '32px' }}>
                            Categoria:
                        </Text>
                        <Select
                            mode="multiple"
                            placeholder="Todas as categorias"
                            allowClear
                            options={DEBT_CATEGORY_OPTIONS}
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            style={{ minWidth: 220 }}
                            maxTagCount="responsive"
                        />
                    </div>
                </div>
            </div>

            <Title level={3} style={{ marginBottom: 16 }}>
                Contas a Pagar
            </Title>

            <Space size={8} style={{ marginBottom: 16 }} wrap>
                <Card
                    size="small"
                    hoverable
                    onClick={() => setQuickFilter(quickFilter === 'due_soon' ? null : 'due_soon')}
                    style={{
                        cursor: 'pointer',
                        borderColor: quickFilter === 'due_soon' ? token.colorWarning : undefined,
                        borderWidth: quickFilter === 'due_soon' ? 2 : 1,
                        background: quickFilter === 'due_soon' ? token.colorWarningBg : undefined,
                    }}
                    styles={{ body: { padding: '8px 12px' } }}
                >
                    <Space size={8}>
                        <CalendarOutlined style={{ fontSize: 16, color: token.colorWarning }} />
                        <Text strong style={{ fontSize: 13 }}>
                            Vencendo em {DUE_SOON_DAYS} dias
                        </Text>
                        <Tag color="warning" style={{ margin: 0 }}>{dueSoonCount}</Tag>
                    </Space>
                </Card>
                <Card
                    size="small"
                    hoverable
                    onClick={() => setQuickFilter(quickFilter === 'installment' ? null : 'installment')}
                    style={{
                        cursor: 'pointer',
                        borderColor: quickFilter === 'installment' ? '#1890ff' : undefined,
                        borderWidth: quickFilter === 'installment' ? 2 : 1,
                        background: quickFilter === 'installment' ? '#e6f7ff' : undefined,
                    }}
                    styles={{ body: { padding: '8px 12px' } }}
                >
                    <Space size={8}>
                        <UnorderedListOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                        <Text strong style={{ fontSize: 13 }}>
                            Parceladas
                        </Text>
                        <Tag color="blue" style={{ margin: 0 }}>{installmentCount}</Tag>
                    </Space>
                </Card>
            </Space>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 48 }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Tabs
                    defaultActiveKey="open"
                    items={STATUS_TABS.map(({ key, label, icon }) => ({
                        key,
                        label: (
                            <Space size={4}>
                                {icon}
                                <span>{label}</span>
                                <Tag style={{ margin: 0 }}>{itemsByTab.get(key)?.length ?? 0}</Tag>
                            </Space>
                        ),
                        children: (
                            <Space direction="vertical" size={8} style={{ width: '100%', paddingTop: 8 }}>
                                {(itemsByTab.get(key) ?? []).length === 0 ? (
                                    <Card>
                                        <Empty description={`Nenhuma conta "${label.toLowerCase()}" no período`} />
                                    </Card>
                                ) : (
                                    (itemsByTab.get(key) ?? []).map(item => (
                                        <DebtCard
                                            key={item.id}
                                            item={item}
                                            onClick={() => handleCardClick(item.debtId)}
                                        />
                                    ))
                                )}
                            </Space>
                        ),
                    }))}
                />
            )}

            <DebtEditModal
                open={editModalOpen}
                onClose={handleEditModalClose}
                debt={selectedDebt}
            />
        </div>
    );
}
