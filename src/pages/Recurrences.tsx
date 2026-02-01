import { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Tag,
    Space,
    Typography,
    Card,
    Empty,
    Tooltip,
    Row,
    Col,
} from 'antd';
import {
    PlusOutlined,
    SyncOutlined,
    EditOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useRecurrences, Recurrence } from '../api';
import { RecurrenceFormModal } from '../components/RecurrenceFormModal';
import { formatCurrency } from '../utils/format';

const { Title, Text } = Typography;

function useIsMobile(maxWidth = 768) {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
        setIsMobile(mq.matches);
        const listener = () => setIsMobile(mq.matches);
        mq.addEventListener('change', listener);
        return () => mq.removeEventListener('change', listener);
    }, [maxWidth]);
    return isMobile;
}

function RecurrenceCard({
    record,
    onClick,
}: {
    record: Recurrence;
    onClick: () => void;
}) {
    const start = dayjs(record.startDate).format('DD/MM/YYYY');
    const end = record.endDate
        ? dayjs(record.endDate).format('DD/MM/YYYY')
        : 'Indefinido';

    return (
        <Card
            size="small"
            hoverable
            onClick={onClick}
            styles={{ body: { padding: 12 } }}
            style={{ cursor: 'pointer' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <Space size={4}>
                        <SyncOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                        <Text strong style={{ fontSize: 14 }}>{record.description}</Text>
                        <EditOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                    </Space>
                    {record.active ? (
                        <Tag color="success" icon={<CheckCircleOutlined />} style={{ margin: 0 }}>
                            Ativa
                        </Tag>
                    ) : (
                        <Tag color="error" icon={<CloseCircleOutlined />} style={{ margin: 0 }}>
                            Inativa
                        </Tag>
                    )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <Text strong style={{ color: '#cf1322', fontSize: 14 }}>
                        R$ {formatCurrency(parseFloat(record.amount))}
                    </Text>
                    <Tag color="blue" style={{ margin: 0 }}>
                        Dia {record.dayOfMonth}
                    </Tag>
                </div>
                <Tooltip title={`De ${start} até ${end}`}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {start} → {end}
                    </Text>
                </Tooltip>
            </div>
        </Card>
    );
}

export function Recurrences() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRecurrence, setSelectedRecurrence] = useState<Recurrence | null>(null);
    const isMobile = useIsMobile();
    const { data: recurrences, isLoading } = useRecurrences({});

    const handleRowClick = (record: Recurrence) => {
        setSelectedRecurrence(record);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedRecurrence(null);
    };

    const handleNewRecurrence = () => {
        setSelectedRecurrence(null);
        setModalOpen(true);
    };

    const columns: ColumnsType<Recurrence> = [
        {
            title: 'Descrição',
            dataIndex: 'description',
            key: 'description',
            render: (description: string) => (
                <Space>
                    <SyncOutlined style={{ color: '#1890ff' }} />
                    <span style={{ fontWeight: 500 }}>{description}</span>
                    <EditOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                </Space>
            ),
        },
        {
            title: 'Valor',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: string) => (
                <Text strong style={{ color: '#cf1322' }}>
                    R$ {formatCurrency(parseFloat(amount))}
                </Text>
            ),
        },
        {
            title: 'Dia do Mês',
            dataIndex: 'dayOfMonth',
            key: 'dayOfMonth',
            render: (day: number) => (
                <Tag color="blue">Dia {day}</Tag>
            ),
        },
        {
            title: 'Período',
            key: 'period',
            render: (_, record) => {
                const start = dayjs(record.startDate).format('DD/MM/YYYY');
                const end = record.endDate
                    ? dayjs(record.endDate).format('DD/MM/YYYY')
                    : 'Indefinido';
                return (
                    <Tooltip title={`De ${start} até ${end}`}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {start} → {end}
                        </Text>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'active',
            key: 'active',
            render: (active: boolean) =>
                active ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                        Ativa
                    </Tag>
                ) : (
                    <Tag color="error" icon={<CloseCircleOutlined />}>
                        Inativa
                    </Tag>
                ),
        },
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div
                className="page-header-inline"
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    Contas Recorrentes
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleNewRecurrence}
                    size="large"
                    className="btn-new-recurrence"
                >
                    Nova Conta Recorrente
                </Button>
            </div>

            <Card>
                {isMobile ? (
                    isLoading ? (
                        <div style={{ padding: 24, textAlign: 'center' }}>
                            <Empty description="Carregando..." />
                        </div>
                    ) : !recurrences?.length ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Nenhuma conta recorrente cadastrada"
                        >
                            <Button type="primary" onClick={handleNewRecurrence}>
                                Cadastrar primeira conta recorrente
                            </Button>
                        </Empty>
                    ) : (
                        <Row gutter={[12, 12]}>
                            {recurrences.map((record) => (
                                <Col xs={24} key={record.id}>
                                    <RecurrenceCard
                                        record={record}
                                        onClick={() => handleRowClick(record)}
                                    />
                                </Col>
                            ))}
                        </Row>
                    )
                ) : (
                    <Table
                        columns={columns}
                        dataSource={recurrences}
                        rowKey="id"
                        loading={isLoading}
                        onRow={(record) => ({
                            onClick: () => handleRowClick(record),
                            style: { cursor: 'pointer' },
                        })}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `${total} conta(s) recorrente(s)`,
                        }}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Nenhuma conta recorrente cadastrada"
                                >
                                    <Button type="primary" onClick={handleNewRecurrence}>
                                        Cadastrar primeira conta recorrente
                                    </Button>
                                </Empty>
                            ),
                        }}
                    />
                )}
            </Card>

            <RecurrenceFormModal
                open={modalOpen}
                onClose={handleModalClose}
                recurrence={selectedRecurrence}
            />
        </div>
    );
}
