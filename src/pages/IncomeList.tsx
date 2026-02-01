import { useState, useMemo } from 'react';
import {
    Typography,
    Card,
    Spin,
    Empty,
    Row,
    Col,
    Button,
    theme,
} from 'antd';
import { FilterOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useIncomes, Income } from '../api';
import { formatCurrency } from '../utils/format';
import { FilterBar, FilterBarValues, getDefaultFilters } from '../components/FilterBar';
import { IncomeFormModal } from '../components/IncomeFormModal';

const { Title, Text } = Typography;

interface IncomeCardProps {
    item: Income;
}

function IncomeCard({ item }: IncomeCardProps) {
    const referenceDate = dayjs(item.reference);

    return (
        <Card
            size="small"
            style={{
                borderLeft: '4px solid #52c41a',
            }}
            styles={{ body: { padding: '10px 12px' } }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 13, wordBreak: 'break-word', display: 'block' }}>
                        {item.description}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        Ref. {referenceDate.format('DD/MM/YYYY')}
                    </Text>
                </div>
                <Text strong style={{ fontSize: 14, color: '#52c41a' }}>
                    {formatCurrency(parseFloat(item.amount))}
                </Text>
            </div>
        </Card>
    );
}

export function IncomeList() {
    const { token } = theme.useToken();
    const [filters, setFilters] = useState<FilterBarValues>(getDefaultFilters);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const incomeListFilters = useMemo(
        () => ({
            startDate: filters.startDate,
            endDate: filters.endDate,
        }),
        [filters.startDate, filters.endDate]
    );
    const { data: incomes, isLoading } = useIncomes(incomeListFilters);

    const sortedIncomes = useMemo(() => {
        if (!incomes) return [];
        return [...incomes].sort(
            (a, b) => dayjs(b.reference).valueOf() - dayjs(a.reference).valueOf()
        );
    }, [incomes]);

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
                <div className="filter-section__label" style={{ marginBottom: 8 }}>
                    <FilterOutlined style={{ color: token.colorTextSecondary }} />
                    <Text strong style={{ color: token.colorTextSecondary }}>
                        Filtros
                    </Text>
                </div>
                <FilterBar value={filters} onChange={setFilters} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>
                    Receitas
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalOpen(true)}
                >
                    Nova receita
                </Button>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 48 }}>
                    <Spin size="large" />
                </div>
            ) : sortedIncomes.length === 0 ? (
                <Card>
                    <Empty description="Nenhuma receita no período" />
                </Card>
            ) : (
                <Row gutter={[12, 12]}>
                    {sortedIncomes.map((item) => (
                        <Col xs={24} sm={12} md={8} key={item.id}>
                            <IncomeCard item={item} />
                        </Col>
                    ))}
                </Row>
            )}

            <IncomeFormModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
            />
        </div>
    );
}
