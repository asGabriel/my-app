import { useState } from 'react';
import {
    Table,
    Button,
    Tag,
    Space,
    Typography,
    Card,
    Empty,
    Tooltip,
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

export function Recurrences() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRecurrence, setSelectedRecurrence] = useState<Recurrence | null>(null);
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
            render: (active: boolean) => (
                active ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                        Ativa
                    </Tag>
                ) : (
                    <Tag color="error" icon={<CloseCircleOutlined />}>
                        Inativa
                    </Tag>
                )
            ),
        },
    ];

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
            }}>
                <Title level={3} style={{ margin: 0 }}>
                    Contas Recorrentes
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleNewRecurrence}
                    size="large"
                >
                    Nova Conta Recorrente
                </Button>
            </div>

            <Card>
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
                                <Button
                                    type="primary"
                                    onClick={handleNewRecurrence}
                                >
                                    Cadastrar primeira conta recorrente
                                </Button>
                            </Empty>
                        ),
                    }}
                />
            </Card>

            <RecurrenceFormModal
                open={modalOpen}
                onClose={handleModalClose}
                recurrence={selectedRecurrence}
            />
        </div>
    );
}
