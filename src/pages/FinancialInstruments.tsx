import { useState, useEffect, type ReactNode } from 'react';
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
    CreditCardOutlined,
    BankOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useFinancialInstruments, FinancialInstrument } from '../api';
import { FinancialInstrumentFormModal } from '../components/FinancialInstrumentFormModal';

const { Title, Text } = Typography;

const INSTRUMENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: ReactNode }> = {
    CREDIT_CARD: {
        label: 'Cartão de Crédito',
        color: 'purple',
        icon: <CreditCardOutlined />,
    },
    DEBIT_ACCOUNT: {
        label: 'Conta Corrente',
        color: 'blue',
        icon: <BankOutlined />,
    },
    INVESTMENT_BOX: {
        label: 'Caixinha',
        color: 'green',
        icon: <WalletOutlined />,
    },
};

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

function InstrumentCard({ record }: { record: FinancialInstrument }) {
    const typeConfig = record.instrumentType
        ? INSTRUMENT_TYPE_CONFIG[record.instrumentType]
        : null;
    const dueDate = record.configuration?.defaultDueDate;

    return (
        <Card size="small" styles={{ body: { padding: 12 } }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                    <Space size={4}>
                        {typeConfig?.icon}
                        <Text strong style={{ fontSize: 14 }}>{record.name}</Text>
                    </Space>
                    {typeConfig && (
                        <Tag color={typeConfig.color} style={{ margin: 0 }}>
                            {typeConfig.label}
                        </Tag>
                    )}
                </div>
                <code
                    style={{
                        background: '#f5f5f5',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        wordBreak: 'break-all',
                    }}
                >
                    {record.identification}
                </code>
                {record.owner && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Titular: {record.owner}
                    </Text>
                )}
                {dueDate != null && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Vencimento: dia {dueDate}
                    </Text>
                )}
            </div>
        </Card>
    );
}

export function FinancialInstruments() {
    const [modalOpen, setModalOpen] = useState(false);
    const isMobile = useIsMobile();
    const { data: instruments, isLoading } = useFinancialInstruments();

    const columns: ColumnsType<FinancialInstrument> = [
        {
            title: 'Nome',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record) => {
                const typeConfig = record.instrumentType
                    ? INSTRUMENT_TYPE_CONFIG[record.instrumentType]
                    : null;
                return (
                    <Space>
                        {typeConfig?.icon}
                        <span style={{ fontWeight: 500 }}>{name}</span>
                    </Space>
                );
            },
        },
        {
            title: 'Identificação',
            dataIndex: 'identification',
            key: 'identification',
            render: (id: string) => (
                <code
                    style={{
                        background: '#f5f5f5',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                    }}
                >
                    {id}
                </code>
            ),
        },
        {
            title: 'Titular',
            dataIndex: 'owner',
            key: 'owner',
        },
        {
            title: 'Tipo',
            dataIndex: 'instrumentType',
            key: 'instrumentType',
            render: (type: string) => {
                if (!type) return <Tag>Não definido</Tag>;
                const config = INSTRUMENT_TYPE_CONFIG[type];
                return config ? (
                    <Tag color={config.color}>{config.label}</Tag>
                ) : (
                    <Tag>{type}</Tag>
                );
            },
        },
        {
            title: 'Vencimento',
            key: 'dueDate',
            render: (_, record) => {
                const dueDate = record.configuration?.defaultDueDate;
                if (!dueDate) return '-';
                return (
                    <Tooltip title="Dia de vencimento da fatura">
                        <span>Dia {dueDate}</span>
                    </Tooltip>
                );
            },
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
                    Instrumentos Financeiros
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setModalOpen(true)}
                    size="large"
                    className="btn-new-instrument"
                >
                    Novo Instrumento
                </Button>
            </div>

            <Card>
                {isMobile ? (
                    isLoading ? (
                        <div style={{ padding: 24, textAlign: 'center' }}>
                            <Empty description="Carregando..." />
                        </div>
                    ) : !instruments?.length ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="Nenhum instrumento financeiro cadastrado"
                        >
                            <Button type="primary" onClick={() => setModalOpen(true)}>
                                Cadastrar primeiro instrumento
                            </Button>
                        </Empty>
                    ) : (
                        <Row gutter={[12, 12]}>
                            {instruments.map((record) => (
                                <Col xs={24} key={record.id}>
                                    <InstrumentCard record={record} />
                                </Col>
                            ))}
                        </Row>
                    )
                ) : (
                    <Table
                        columns={columns}
                        dataSource={instruments}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `${total} instrumento(s)`,
                        }}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Nenhum instrumento financeiro cadastrado"
                                >
                                    <Button type="primary" onClick={() => setModalOpen(true)}>
                                        Cadastrar primeiro instrumento
                                    </Button>
                                </Empty>
                            ),
                        }}
                    />
                )}
            </Card>

            <FinancialInstrumentFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
}
