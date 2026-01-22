import { useState, type ReactNode } from 'react';
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
    CreditCardOutlined, 
    BankOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useFinancialInstruments, FinancialInstrument } from '../api';
import { FinancialInstrumentFormModal } from '../components/FinancialInstrumentFormModal';

const { Title } = Typography;

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

export function FinancialInstruments() {
    const [modalOpen, setModalOpen] = useState(false);
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
                <code style={{ 
                    background: '#f5f5f5', 
                    padding: '2px 8px', 
                    borderRadius: 4,
                    fontSize: 12,
                }}>
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
                return config 
                    ? <Tag color={config.color}>{config.label}</Tag> 
                    : <Tag>{type}</Tag>;
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
        <div>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 24,
            }}>
                <Title level={3} style={{ margin: 0 }}>
                    Instrumentos Financeiros
                </Title>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setModalOpen(true)}
                    size="large"
                >
                    Novo Instrumento
                </Button>
            </div>

            <Card>
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
                                <Button 
                                    type="primary" 
                                    onClick={() => setModalOpen(true)}
                                >
                                    Cadastrar primeiro instrumento
                                </Button>
                            </Empty>
                        ),
                    }}
                />
            </Card>

            <FinancialInstrumentFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </div>
    );
}
